// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

pub mod channels;
pub mod rbac_config;
pub mod rbac_session;
pub(crate) mod worker_socket;
pub mod ws_handler;

use std::{
    cmp::Ordering,
    io,
    net::SocketAddr,
    sync::{Arc, LazyLock, Mutex as StdMutex},
    time::Duration,
};

use axum::{
    Router,
    extract::{ConnectInfo, State, ws::WebSocketUpgrade},
    http::{HeaderMap, HeaderName, HeaderValue, Uri},
    response::{IntoResponse, Response},
    routing::get,
};
use colored::Colorize;
use hyper::server::conn::http1;
use hyper_util::{
    rt::{TokioIo, TokioTimer},
    service::TowerToHyperService,
};
use iii_sdk::protocol::{ENGINE_CAPABILITIES_HEADER, ENGINE_CAPABILITY_TCP_NODELAY};
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::{net::TcpListener, task::AbortHandle};
use tower::Service as _;

use crate::{
    engine::Engine,
    protocol::StreamChannelRef,
    worker_connections::WorkerFeatures,
    workers::{
        traits::Worker,
        worker::{worker_socket::WorkerSocketUpgrade, ws_handler::channel_ws_upgrade},
    },
};

/// Main worker JSON frame: 16 MiB (16,777,216 bytes), not channel transport.
pub(crate) const MAX_JSON_FRAME_BYTES: usize = 16 * 1024 * 1024;
/// Main worker JSON message: 64 MiB (67,108,864 bytes), not channel transport.
pub(crate) const MAX_JSON_MESSAGE_BYTES: usize = 64 * 1024 * 1024;

pub const DEFAULT_PORT: u16 = 49134;

/// First SDK release that receives [`MAX_JSON_MESSAGE_BYTES`].
const LARGE_MESSAGE_SDK_RELEASE: [u64; 3] = [0, 24, 5];

/// Selects the outbound JSON envelope limit of a connection from its
/// `engine::workers::register` call, and whether a size rejection should
/// recommend upgrading its SDK.
///
/// - `runtime: "browser"`: one 16 MiB frame, whatever else it sent.
/// - Declared `observe.v1` or `local-dispatch.v1`: only SDK 0.25 and later
///   declare them, so 64 MiB. `version` is not read: a Rust worker may report
///   its own crate version there (`WorkerMetadata.version`).
/// - No features (SDK 0.24.5 and 0.24.6 declare none): 64 MiB when `version`
///   is an SDK release of 0.24.5 or later ([`is_large_message_sdk_version`]),
///   otherwise 16 MiB.
pub(crate) fn receive_message_limit(
    runtime: Option<&str>,
    version: Option<&str>,
    features: &WorkerFeatures,
) -> (usize, bool) {
    if runtime == Some("browser") {
        return (MAX_JSON_FRAME_BYTES, false);
    }
    let receives_large_messages = features.observe_v1()
        || features.local_dispatch_v1()
        || version.is_some_and(is_large_message_sdk_version);
    if receives_large_messages {
        (MAX_JSON_MESSAGE_BYTES, false)
    } else {
        (MAX_JSON_FRAME_BYTES, true)
    }
}

/// A PEP 440 version (the `VERSION_PATTERN` of Python's `packaging`), as the
/// Python SDK reports it: `0.25.0rc5`, `0.25.0a3`, `0.25.0.dev1`,
/// `0.24.5.post1`.
static PEP440_VERSION: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"(?ix)^\s*v?
        (?:(?P<epoch>[0-9]+)!)?
        (?P<release>[0-9]+(?:\.[0-9]+)*)
        (?P<pre>[-_.]?(?:alpha|a|beta|b|preview|pre|c|rc)[-_.]?[0-9]*)?
        (?P<post>-[0-9]+|[-_.]?(?:post|rev|r)[-_.]?[0-9]*)?
        (?P<dev>[-_.]?dev[-_.]?[0-9]*)?
        (?:\+[a-z0-9]+(?:[-_.][a-z0-9]+)*)?
        \s*$",
    )
    .expect("valid PEP 440 pattern")
});

/// Whether `version` is an SDK release of 0.24.5 or later, written as semver
/// (Rust, Node and Go: `0.25.0-rc.5`) or PEP 440 (Python: `0.25.0rc5`).
/// Pre-releases and dev releases of 0.24.5 are below it, post releases above.
fn is_large_message_sdk_version(version: &str) -> bool {
    let [major, minor, patch] = LARGE_MESSAGE_SDK_RELEASE;
    if let Ok(version) = semver::Version::parse(version) {
        return version >= semver::Version::new(major, minor, patch);
    }
    let Some(parts) = PEP440_VERSION.captures(version) else {
        return false;
    };
    // Any epoch above 0 sorts after every release without one.
    if parts
        .name("epoch")
        .is_some_and(|epoch| epoch.as_str().bytes().any(|digit| digit != b'0'))
    {
        return true;
    }
    let Ok(mut release) = parts["release"]
        .split('.')
        .map(str::parse::<u64>)
        .collect::<Result<Vec<_>, _>>()
    else {
        return false;
    };
    // Trailing zeros do not count: 0.24.5.0 is 0.24.5.
    let mut minimum = LARGE_MESSAGE_SDK_RELEASE.to_vec();
    let len = release.len().max(minimum.len());
    release.resize(len, 0);
    minimum.resize(len, 0);
    match release.cmp(&minimum) {
        Ordering::Greater => true,
        Ordering::Less => false,
        // 0.24.5rc1 and 0.24.5.dev1 come before 0.24.5; 0.24.5.post1 (and
        // its own dev releases) after.
        Ordering::Equal => {
            parts.name("pre").is_none()
                && (parts.name("dev").is_none() || parts.name("post").is_some())
        }
    }
}

/// Default deadline for an accepted TCP connection to complete its HTTP
/// request (the WS upgrade). Generous for a handshake that normally takes
/// milliseconds; the point is bounding it at all (MOT-3967).
pub const DEFAULT_HANDSHAKE_TIMEOUT_MS: u64 = 10_000;

#[derive(Debug, Clone, Deserialize, Serialize, Default, JsonSchema)]
pub struct CreateChannelInput {
    /// Maximum number of pending messages buffered between writer and reader.
    /// Defaults to an engine-chosen value when omitted.
    #[serde(default)]
    pub buffer_size: Option<usize>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default, JsonSchema)]
pub struct CreateChannelOutput {
    pub writer: StreamChannelRef,
    pub reader: StreamChannelRef,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct WorkerManagerConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default)]
    pub middleware_function_id: Option<String>,
    pub rbac: Option<rbac_config::RbacConfig>,
    /// Deadline in milliseconds for an accepted TCP connection to complete
    /// its HTTP request (the WS upgrade). Sockets that stall pre-upgrade
    /// are closed and logged instead of leaking the fd (MOT-3967).
    #[serde(default = "default_handshake_timeout_ms")]
    pub handshake_timeout_ms: u64,
}

fn default_port() -> u16 {
    DEFAULT_PORT
}

fn default_host() -> String {
    "0.0.0.0".to_string()
}

fn default_handshake_timeout_ms() -> u64 {
    DEFAULT_HANDSHAKE_TIMEOUT_MS
}

impl Default for WorkerManagerConfig {
    fn default() -> Self {
        Self {
            port: default_port(),
            host: default_host(),
            middleware_function_id: None,
            rbac: None,
            handshake_timeout_ms: default_handshake_timeout_ms(),
        }
    }
}

#[derive(Clone)]
pub struct WorkerManager {
    engine: Arc<Engine>,
    config: WorkerManagerConfig,
    server_abort: Arc<StdMutex<Option<AbortHandle>>>,
}

#[async_trait::async_trait]
impl Worker for WorkerManager {
    fn name(&self) -> &'static str {
        "WorkerManager"
    }

    async fn create(engine: Arc<Engine>, config: Option<Value>) -> anyhow::Result<Box<dyn Worker>> {
        let config: WorkerManagerConfig = config
            .map(serde_json::from_value)
            .transpose()?
            .unwrap_or_default();

        Ok(Box::new(WorkerManager {
            engine,
            config,
            server_abort: Arc::new(StdMutex::new(None)),
        }))
    }

    async fn start_background_tasks(
        &self,
        mut shutdown_rx: tokio::sync::watch::Receiver<bool>,
        shutdown_tx: tokio::sync::watch::Sender<bool>,
    ) -> anyhow::Result<()> {
        let config = Arc::new(self.config.clone());
        let state = AppState {
            engine: self.engine.clone(),
            config: config.clone(),
            shutdown_rx: shutdown_rx.clone(),
        };

        let addr = format!("{}:{}", config.host, config.port);
        let listener = TcpListener::bind(&addr)
            .await
            .map_err(|err| crate::workers::traits::bind_address_error(&addr, err))?;
        tracing::info!("Engine listening on address: {}", addr.purple());
        // Lets `iii ps` and `iii kill --port` find this engine by its port.
        // Removed when the server task below ends.
        let marker = listener
            .local_addr()
            .ok()
            .and_then(|local| iii_compose::ps::announce_engine(&format!("ws://{local}")));

        let app = worker_router(state);

        let handshake_timeout = Duration::from_millis(config.handshake_timeout_ms);
        let handle = tokio::spawn(async move {
            let _marker = marker;
            let shutdown = async move {
                tokio::select! {
                    _ = shutdown_signal() => {
                        let _ = shutdown_tx.send(true);
                    }
                    _ = async {
                        while shutdown_rx.changed().await.is_ok() {
                            if *shutdown_rx.borrow() {
                                break;
                            }
                        }
                    } => {}
                }
            };
            tokio::pin!(shutdown);

            // Fans shutdown out to every spawned connection task, mirroring
            // what axum::serve did internally: sent when the accept loop
            // exits, and if this task is aborted (`destroy()`), the dropped
            // sender wakes subscribers the same way.
            let (conn_shutdown_tx, _) = tokio::sync::watch::channel(false);

            // Serve connections manually instead of via `axum::serve`:
            // hyper's `header_read_timeout` is the handshake deadline that
            // reaps sockets stalling before the WS upgrade completes
            // (MOT-3967), and axum::serve exposes neither it nor the timer
            // it requires. Established WS sessions are unaffected — the
            // deadline only bounds reading request headers.
            let mut make_service = app.into_make_service_with_connect_info::<SocketAddr>();
            loop {
                let (stream, peer) = tokio::select! {
                    // Through accept_worker_connection: it sets TCP_NODELAY (MOT-5377).
                    res = accept_worker_connection(&listener) => match res {
                        Ok(conn) => conn,
                        Err(err) => {
                            // ECONNABORTED/RESET are normal client churn;
                            // anything else (e.g. EMFILE) gets a pause so
                            // the accept loop doesn't spin.
                            if !is_connection_error(&err) {
                                tracing::warn!(error = ?err, "worker listener accept error");
                                tokio::time::sleep(Duration::from_secs(1)).await;
                            }
                            continue;
                        }
                    },
                    _ = &mut shutdown => break,
                };
                let service = match make_service.call(peer).await {
                    Ok(service) => service,
                    Err(infallible) => match infallible {},
                };
                let mut conn_shutdown_rx = conn_shutdown_tx.subscribe();
                tokio::spawn(async move {
                    let conn = http1::Builder::new()
                        .timer(TokioTimer::new())
                        .header_read_timeout(handshake_timeout)
                        .serve_connection(TokioIo::new(stream), TowerToHyperService::new(service))
                        .with_upgrades();
                    tokio::pin!(conn);
                    // Completes on shutdown send or sender drop (abort).
                    let conn_shutdown = async move {
                        while conn_shutdown_rx.changed().await.is_ok() {
                            if *conn_shutdown_rx.borrow() {
                                break;
                            }
                        }
                    };
                    tokio::pin!(conn_shutdown);
                    let mut graceful_sent = false;
                    loop {
                        tokio::select! {
                            res = conn.as_mut() => {
                                if let Err(err) = res {
                                    if err.is_timeout() {
                                        tracing::warn!(
                                            peer = %peer,
                                            timeout_ms = handshake_timeout.as_millis() as u64,
                                            "closed worker socket: WS upgrade not completed within handshake deadline"
                                        );
                                    } else {
                                        tracing::debug!(peer = %peer, error = ?err, "worker connection error");
                                    }
                                }
                                break;
                            }
                            // Close idle keep-alive connections immediately
                            // and mark in-flight ones close-after-response,
                            // then keep polling the connection to completion.
                            _ = &mut conn_shutdown, if !graceful_sent => {
                                conn.as_mut().graceful_shutdown();
                                graceful_sent = true;
                            }
                        }
                    }
                });
            }

            let _ = conn_shutdown_tx.send(true);
        });

        *self
            .server_abort
            .lock()
            .expect("server_abort mutex poisoned") = Some(handle.abort_handle());

        Ok(())
    }

    async fn initialize(&self) -> anyhow::Result<()> {
        tracing::info!("Initializing WorkerManager");
        Ok(())
    }

    async fn destroy(&self) -> anyhow::Result<()> {
        let abort = self
            .server_abort
            .lock()
            .expect("server_abort mutex poisoned")
            .take();
        if let Some(abort) = abort {
            abort.abort();
        }
        Ok(())
    }
}

#[derive(Clone)]
pub struct AppState {
    pub engine: Arc<Engine>,
    pub config: Arc<WorkerManagerConfig>,
    pub(crate) shutdown_rx: tokio::sync::watch::Receiver<bool>,
}

/// Accept errors caused by the remote end (mirrors `axum::serve`'s internal
/// accept loop) — these are normal churn and don't warrant a warning or a
/// pause of the accept loop.
fn is_connection_error(e: &io::Error) -> bool {
    matches!(
        e.kind(),
        io::ErrorKind::ConnectionRefused
            | io::ErrorKind::ConnectionAborted
            | io::ErrorKind::ConnectionReset
    )
}

/// Routes of the worker listener. Every response lists the engine's transport
/// capabilities in [`ENGINE_CAPABILITIES_HEADER`]: the accept loop sets
/// `TCP_NODELAY` on every connection, so workers may disable Nagle on their
/// end too. Workers wait for this before doing so, because Nagle on the
/// engine's end alone is slower than on both ends (MOT-5377).
///
/// The header is static, so this router must only be served through
/// [`accept_worker_connection`], which sets the `TCP_NODELAY` it promises.
fn worker_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(ws_handler))
        .route("/otel", get(otel_ws_handler))
        .route("/ws/channels/{channel_id}", get(channel_ws_upgrade))
        .layer(axum::middleware::map_response(advertise_capabilities))
        .with_state(state)
}

// `from_static` is a const fn, so an invalid name or value fails the build.
const CAPABILITIES_HEADER: HeaderName = HeaderName::from_static(ENGINE_CAPABILITIES_HEADER);
const CAPABILITIES: HeaderValue = HeaderValue::from_static(ENGINE_CAPABILITY_TCP_NODELAY);

async fn advertise_capabilities(mut response: Response) -> Response {
    response
        .headers_mut()
        .insert(CAPABILITIES_HEADER, CAPABILITIES);
    response
}

/// Accepts a worker, channel or `/otel` connection with `TCP_NODELAY` set:
/// their small frames must not wait for the peer's delayed ACK (MOT-5377).
async fn accept_worker_connection(
    listener: &TcpListener,
) -> io::Result<(tokio::net::TcpStream, SocketAddr)> {
    let (stream, peer) = listener.accept().await?;
    if let Err(err) = stream.set_nodelay(true) {
        tracing::debug!(peer = %peer, error = ?err, "set_nodelay failed; small writes may stall");
    }
    Ok((stream, peer))
}

async fn shutdown_signal() -> anyhow::Result<()> {
    #[cfg(unix)]
    {
        use tokio::signal::unix::{SignalKind, signal};

        let mut sigterm = signal(SignalKind::terminate())?;
        let mut sigint = signal(SignalKind::interrupt())?;

        tokio::select! {
            _ = sigterm.recv() => {},
            _ = sigint.recv() => {},
            _ = tokio::signal::ctrl_c() => {},
        }
    }

    #[cfg(not(unix))]
    {
        tokio::signal::ctrl_c().await?;
    }

    Ok(())
}

/// The inbound limit, set in [`ws_handler`], that a worker's frame or message
/// went over.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum InboundLimit {
    /// [`MAX_JSON_FRAME_BYTES`], per WebSocket frame.
    Frame,
    /// [`MAX_JSON_MESSAGE_BYTES`], per message, fragments included.
    Message,
}

/// A worker read that failed because a frame or message is over the inbound
/// limits.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct InboundTooLarge {
    pub(crate) limit: InboundLimit,
    pub(crate) limit_bytes: usize,
    /// The frame's declared length, or for a message, the bytes received when
    /// it crossed the limit (its total length is not known).
    pub(crate) size_bytes: usize,
}

impl InboundTooLarge {
    /// Recognizes the error tungstenite returns for both limits:
    /// `Capacity(MessageTooLong)`, whose `max_size` tells them apart.
    pub(crate) fn from_read_error(error: &axum::Error) -> Option<Self> {
        let error = std::error::Error::source(error)?.downcast_ref::<tungstenite::Error>()?;
        let tungstenite::Error::Capacity(tungstenite::error::CapacityError::MessageTooLong {
            size,
            max_size,
        }) = *error
        else {
            return None;
        };
        let limit = if max_size == MAX_JSON_FRAME_BYTES {
            InboundLimit::Frame
        } else {
            InboundLimit::Message
        };
        Some(Self {
            limit,
            limit_bytes: max_size,
            size_bytes: size,
        })
    }

    pub(crate) fn limit_name(&self) -> &'static str {
        match self.limit {
            InboundLimit::Frame => "frame",
            InboundLimit::Message => "message",
        }
    }

    /// Close code 1009 (Message Too Big). The reason stays within the 123
    /// bytes a Close frame allows.
    pub(crate) fn close_frame(&self) -> axum::extract::ws::CloseFrame {
        let reason = match self.limit {
            InboundLimit::Frame => format!(
                "frame of {} bytes exceeds the {}-byte frame limit; upgrade the SDK or use a channel",
                self.size_bytes, self.limit_bytes
            ),
            InboundLimit::Message => format!(
                "message exceeds the {}-byte message limit; use a channel for large payloads",
                self.limit_bytes
            ),
        };
        axum::extract::ws::CloseFrame {
            code: axum::extract::ws::close_code::SIZE,
            reason: reason.into(),
        }
    }
}

async fn ws_handler(
    State(state): State<AppState>,
    ws: WorkerSocketUpgrade,
    uri: Uri,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
) -> impl IntoResponse {
    let engine = state.engine.clone();
    let config = state.config.clone();

    ws.max_frame_size(MAX_JSON_FRAME_BYTES)
        .max_message_size(MAX_JSON_MESSAGE_BYTES)
        .on_upgrade(move |socket| async move {
            if let Err(err) = engine
                .handle_worker(socket, addr, uri, headers, config, state.shutdown_rx)
                .await
            {
                tracing::error!(addr = %addr, error = ?err, "worker error");
            }
        })
}

/// WS upgrade handler for the OTEL-only endpoint (`/otel`).
///
/// Keeps telemetry traffic off the worker registry. See
/// `Engine::handle_otel` for the rationale.
async fn otel_ws_handler(
    State(state): State<AppState>,
    ws: WebSocketUpgrade,
    uri: Uri,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
) -> impl IntoResponse {
    let engine = state.engine.clone();
    let config = state.config.clone();

    ws.on_upgrade(move |socket| async move {
        if let Err(err) = engine
            .handle_otel(socket, addr, uri, headers, config, state.shutdown_rx)
            .await
        {
            tracing::error!(addr = %addr, error = ?err, "otel connection error");
        }
    })
}

crate::register_worker!(
    "iii-worker-manager",
    WorkerManager,
    description = "WebSocket listener that SDK workers connect to. Supports RBAC, middleware, registration hooks, and channels.",
    mandatory
);

#[cfg(test)]
mod tests {
    use super::*;

    /// Serves the real worker router on an ephemeral port. Uses `axum::serve`,
    /// not the production hyper loop: `accept_worker_connection` (the
    /// `TCP_NODELAY` half) has its own test.
    async fn serve_worker_router() -> SocketAddr {
        // Engine::new() and the worker connection handler build metrics, which
        // require GLOBAL_METER. Under nextest each test is its own process, so
        // initialize the default (noop) meter here instead of relying on a
        // sibling test.
        crate::workers::observability::metrics::ensure_default_meter();
        let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
        let state = AppState {
            engine: Arc::new(Engine::new()),
            config: Arc::new(WorkerManagerConfig::default()),
            shutdown_rx,
        };
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        tokio::spawn(async move {
            let _shutdown_tx = shutdown_tx;
            let app = worker_router(state).into_make_service_with_connect_info::<SocketAddr>();
            axum::serve(listener, app).await.unwrap();
        });
        address
    }

    fn advertised(headers: &HeaderMap) -> Option<&str> {
        headers
            .get(ENGINE_CAPABILITIES_HEADER)
            .and_then(|value| value.to_str().ok())
    }

    #[tokio::test]
    async fn worker_listener_advertises_tcp_nodelay_on_upgrade() {
        let address = serve_worker_router().await;
        for path in ["/", "/otel"] {
            let (_socket, response) =
                tokio_tungstenite::connect_async(format!("ws://{address}{path}"))
                    .await
                    .unwrap();
            assert_eq!(
                advertised(response.headers()),
                Some(ENGINE_CAPABILITY_TCP_NODELAY),
                "path {path}"
            );
        }
    }

    #[tokio::test]
    async fn worker_listener_advertises_tcp_nodelay_on_rejected_channel_upgrade() {
        let address = serve_worker_router().await;
        let url = format!("ws://{address}/ws/channels/missing?key=bad&dir=read");
        let error = tokio_tungstenite::connect_async(url).await.unwrap_err();
        let tokio_tungstenite::tungstenite::Error::Http(response) = error else {
            panic!("expected an HTTP rejection, got {error:?}");
        };
        assert_eq!(
            advertised(response.headers()),
            Some(ENGINE_CAPABILITY_TCP_NODELAY)
        );
    }

    type ClientSocket = tokio_tungstenite::WebSocketStream<
        tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
    >;
    type ClientStream = futures_util::stream::SplitStream<ClientSocket>;

    /// Connects a raw client to the worker endpoint and reads its
    /// `workerregistered` greeting.
    async fn connect_worker(address: SocketAddr) -> ClientSocket {
        use futures_util::StreamExt;
        use tokio_tungstenite::tungstenite::Message as ClientMessage;

        let (mut socket, _) = tokio_tungstenite::connect_async(format!("ws://{address}/"))
            .await
            .unwrap();
        let greeting = tokio::time::timeout(Duration::from_secs(10), socket.next())
            .await
            .expect("engine should greet a new worker")
            .expect("connection open")
            .expect("greeting frame");
        let ClientMessage::Text(greeting) = greeting else {
            panic!("expected a text greeting, got {greeting:?}");
        };
        let greeting: Value = serde_json::from_str(&greeting).unwrap();
        assert_eq!(greeting["type"], "workerregistered");
        socket
    }

    /// Reads until the engine's Close frame. Before the fix the engine dropped
    /// the TCP connection without one, which clients report as close 1006.
    async fn engine_close_frame(
        stream: &mut ClientStream,
    ) -> tokio_tungstenite::tungstenite::protocol::CloseFrame {
        use futures_util::StreamExt;
        use tokio_tungstenite::tungstenite::Message as ClientMessage;

        loop {
            let next = tokio::time::timeout(Duration::from_secs(30), stream.next())
                .await
                .expect("engine should answer the oversized message");
            match next {
                Some(Ok(ClientMessage::Close(Some(frame)))) => return frame,
                Some(Ok(ClientMessage::Close(None))) => panic!("Close frame without a code"),
                Some(Ok(_)) => continue,
                Some(Err(error)) => panic!("connection failed without a Close frame: {error}"),
                None => panic!("connection ended without a Close frame"),
            }
        }
    }

    /// The engine still serves a worker that was connected before the
    /// oversized message, and still accepts new ones.
    async fn assert_engine_serves_workers(address: SocketAddr, bystander: &mut ClientSocket) {
        use futures_util::{SinkExt, StreamExt};
        use tokio_tungstenite::tungstenite::Message as ClientMessage;

        bystander
            .send(ClientMessage::Ping(b"still-there".to_vec().into()))
            .await
            .unwrap();
        let pong = tokio::time::timeout(Duration::from_secs(10), bystander.next())
            .await
            .expect("bystander should get its pong")
            .expect("bystander connection open")
            .expect("pong frame");
        assert_eq!(pong, ClientMessage::Pong(b"still-there".to_vec().into()));

        drop(connect_worker(address).await);
    }

    #[tokio::test]
    async fn oversized_frame_is_closed_with_message_too_big() {
        use futures_util::{SinkExt, StreamExt};
        use tokio_tungstenite::tungstenite::{
            Message as ClientMessage, protocol::frame::coding::CloseCode,
        };

        let address = serve_worker_router().await;
        let mut bystander = connect_worker(address).await;
        let (mut sink, mut stream) = connect_worker(address).await.split();

        // One 20 MiB text frame, the way SDKs older than 0.24.5 send it. The
        // engine rejects it at the frame header, so the client must read
        // while its write is still in flight.
        let payload = "a".repeat(20 * 1024 * 1024);
        let writer = tokio::spawn(async move {
            let _ = sink.send(ClientMessage::text(payload)).await;
        });
        let close = engine_close_frame(&mut stream).await;
        writer.abort();

        assert_eq!(close.code, CloseCode::Size);
        assert!(
            close.reason.contains("frame of 20971520 bytes")
                && close.reason.contains("16777216-byte frame limit"),
            "reason: {}",
            close.reason
        );
        assert_engine_serves_workers(address, &mut bystander).await;
    }

    #[tokio::test]
    async fn oversized_fragmented_message_is_closed_with_message_too_big() {
        use futures_util::{SinkExt, StreamExt};
        use tokio_tungstenite::tungstenite::{
            Message as ClientMessage,
            protocol::frame::{
                Frame,
                coding::{CloseCode, Data, OpCode},
            },
        };

        let address = serve_worker_router().await;
        let mut bystander = connect_worker(address).await;
        let (mut sink, mut stream) = connect_worker(address).await.split();

        // 65 fragments of 1 MiB: every frame is within the 16 MiB frame limit,
        // the message is over the 64 MiB message limit.
        let writer = tokio::spawn(async move {
            let chunk = vec![b'a'; 1024 * 1024];
            for index in 0..65 {
                let data = if index == 0 {
                    Data::Text
                } else {
                    Data::Continue
                };
                let frame = Frame::message(chunk.clone(), OpCode::Data(data), index == 64);
                if sink.send(ClientMessage::Frame(frame)).await.is_err() {
                    break;
                }
            }
        });
        let close = engine_close_frame(&mut stream).await;
        writer.abort();

        assert_eq!(close.code, CloseCode::Size);
        assert!(
            close.reason.contains("67108864-byte message limit"),
            "reason: {}",
            close.reason
        );
        assert_engine_serves_workers(address, &mut bystander).await;
    }

    fn capacity_error(size: usize, max_size: usize) -> axum::Error {
        axum::Error::new(tungstenite::Error::Capacity(
            tungstenite::error::CapacityError::MessageTooLong { size, max_size },
        ))
    }

    #[test]
    fn inbound_too_large_tells_frame_from_message_limit() {
        let frame = InboundTooLarge::from_read_error(&capacity_error(20, MAX_JSON_FRAME_BYTES));
        assert_eq!(
            frame,
            Some(InboundTooLarge {
                limit: InboundLimit::Frame,
                limit_bytes: MAX_JSON_FRAME_BYTES,
                size_bytes: 20,
            })
        );
        let message = InboundTooLarge::from_read_error(&capacity_error(70, MAX_JSON_MESSAGE_BYTES));
        assert_eq!(message.map(|m| m.limit), Some(InboundLimit::Message));

        for other in [
            axum::Error::new(tungstenite::Error::ConnectionClosed),
            axum::Error::new(tungstenite::Error::Capacity(
                tungstenite::error::CapacityError::TooManyHeaders,
            )),
            axum::Error::new(std::io::Error::other("reset")),
        ] {
            assert_eq!(InboundTooLarge::from_read_error(&other), None, "{other}");
        }
    }

    #[test]
    fn inbound_too_large_close_reason_fits_a_close_frame() {
        for max_size in [MAX_JSON_FRAME_BYTES, MAX_JSON_MESSAGE_BYTES] {
            let too_large =
                InboundTooLarge::from_read_error(&capacity_error(usize::MAX, max_size)).unwrap();
            let close = too_large.close_frame();
            assert_eq!(close.code, axum::extract::ws::close_code::SIZE);
            // A Close frame's payload is at most 125 bytes, 2 of them the code.
            assert!(close.reason.len() <= 123, "{} bytes", close.reason.len());
        }
    }

    #[tokio::test]
    async fn accept_worker_connection_sets_tcp_nodelay() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let client = tokio::net::TcpStream::connect(listener.local_addr().unwrap())
            .await
            .unwrap();
        let (stream, _) = accept_worker_connection(&listener).await.unwrap();
        assert!(stream.nodelay().unwrap());
        drop(client);
    }

    #[test]
    fn worker_config_default_values() {
        let config = WorkerManagerConfig::default();

        assert_eq!(config.port, DEFAULT_PORT);
        assert_eq!(config.host, "0.0.0.0");
        assert!(config.middleware_function_id.is_none());
        assert!(config.rbac.is_none());
        assert_eq!(config.handshake_timeout_ms, DEFAULT_HANDSHAKE_TIMEOUT_MS);
    }

    #[test]
    fn worker_config_deserialize_empty_json_uses_defaults() {
        let config: WorkerManagerConfig = serde_json::from_str("{}").unwrap();

        assert_eq!(config.port, DEFAULT_PORT);
        assert_eq!(config.host, "0.0.0.0");
        assert!(config.middleware_function_id.is_none());
        assert!(config.rbac.is_none());
        assert_eq!(config.handshake_timeout_ms, DEFAULT_HANDSHAKE_TIMEOUT_MS);
    }

    #[test]
    fn worker_config_rejects_registration_namespace_grace() {
        let result = serde_json::from_str::<WorkerManagerConfig>(
            r#"{"registration_namespace_grace_ms":10000}"#,
        );

        assert!(result.is_err());
    }

    #[test]
    fn receive_message_limit_follows_features_runtime_and_sdk_version() {
        const FRAME: (usize, bool) = (MAX_JSON_FRAME_BYTES, true);
        const BROWSER: (usize, bool) = (MAX_JSON_FRAME_BYTES, false);
        const MESSAGE: (usize, bool) = (MAX_JSON_MESSAGE_BYTES, false);
        const SDK_0_25: &[&str] = &["observe.v1", "local-dispatch.v1"];
        /// Runtime, version and features sent on registration; the expected limit.
        type Case = (
            Option<&'static str>,
            Option<&'static str>,
            &'static [&'static str],
            (usize, bool),
        );
        let cases: &[Case] = &[
            // Before registration, the connection has no SDK metadata.
            (None, None, &[], FRAME),
            // SDK 0.25 or later, by its features, whatever version it reports
            // (Rust workers report their own crate version).
            (Some("rust"), Some("0.3.0"), SDK_0_25, MESSAGE),
            (Some("rust"), Some("0.1.1"), &["observe.v1"], MESSAGE),
            (
                Some("node"),
                Some("0.22.7"),
                &["local-dispatch.v1"],
                MESSAGE,
            ),
            (Some("python"), Some("0.25.0rc5"), SDK_0_25, MESSAGE),
            (Some("go"), Some("garbage"), SDK_0_25, MESSAGE),
            (Some("unknown"), None, SDK_0_25, MESSAGE),
            // A feature this engine does not know proves nothing.
            (Some("rust"), Some("0.3.0"), &["telepathy.v9"], FRAME),
            // A browser receives one frame, with or without features.
            (Some("browser"), Some("0.25.0"), SDK_0_25, BROWSER),
            (Some("browser"), Some("1.0.0"), &[], BROWSER),
            (Some("browser"), None, &[], BROWSER),
            // No features (SDK 0.24.5, 0.24.6): the SDK version, as semver...
            (Some("rust"), Some("0.24.5"), &[], MESSAGE),
            (Some("node"), Some("0.24.6"), &[], MESSAGE),
            (Some("node"), Some("0.25.0-rc.5"), &[], MESSAGE),
            (Some("go"), Some("1.0.0"), &[], MESSAGE),
            (Some("rust"), Some("0.24.5+build.1"), &[], MESSAGE),
            (Some("rust"), Some("0.24.4"), &[], FRAME),
            (Some("rust"), Some("0.24.5-rc.1"), &[], FRAME),
            (Some("rust"), Some("0.3.0"), &[], FRAME),
            // ...or as PEP 440, which the Python SDK reports.
            (Some("python"), Some("0.25.0rc5"), &[], MESSAGE),
            (Some("python"), Some("0.25.0a3"), &[], MESSAGE),
            (Some("python"), Some("0.25.0.dev1"), &[], MESSAGE),
            (Some("python"), Some("0.25.0RC5"), &[], MESSAGE),
            (Some("python"), Some("0.24.5.post1"), &[], MESSAGE),
            (Some("python"), Some("0.24.5.post1.dev0"), &[], MESSAGE),
            (Some("python"), Some("0.24.5.0"), &[], MESSAGE),
            (Some("python"), Some("0.24.6+local.7"), &[], MESSAGE),
            (Some("python"), Some("v0.25"), &[], MESSAGE),
            (Some("python"), Some("1!0.1"), &[], MESSAGE),
            (Some("python"), Some("0.24.5rc1"), &[], FRAME),
            (Some("python"), Some("0.24.5a1.post2"), &[], FRAME),
            (Some("python"), Some("0.24.5.dev3"), &[], FRAME),
            (Some("python"), Some("0.24.4.post9"), &[], FRAME),
            (Some("python"), Some("0!0.24.4"), &[], FRAME),
            (Some("python"), Some("0.24"), &[], FRAME),
            // Missing, or not a version.
            (Some("node"), None, &[], FRAME),
            (Some("python"), Some("unknown"), &[], FRAME),
            (Some("rust"), Some(""), &[], FRAME),
            (Some("rust"), Some("garbage"), &[], FRAME),
            (Some("rust"), Some("0.25.0 beta"), &[], FRAME),
            (Some("rust"), Some("99999999999999999999.0"), &[], FRAME),
        ];

        for (runtime, version, features, expected) in cases {
            let declared = WorkerFeatures::default();
            declared.set(&features.iter().map(|f| f.to_string()).collect::<Vec<_>>());
            assert_eq!(
                receive_message_limit(*runtime, *version, &declared),
                *expected,
                "runtime={runtime:?}, version={version:?}, features={features:?}"
            );
        }
    }
}
