// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

//! The worker connection's WebSocket: the upgrade, and how the engine frames
//! the JSON envelopes it writes to a worker.
//!
//! axum's `WebSocket` sends every message as one frame and exposes no frame
//! API, so the worker endpoint upgrades to a tokio-tungstenite stream instead
//! and fragments large envelopes itself (see [`json_frames`]).

use std::future::Future;

use axum::{
    body::Body,
    extract::{
        FromRequestParts,
        ws::rejection::{
            ConnectionNotUpgradable, InvalidConnectionHeader, InvalidUpgradeHeader,
            InvalidWebSocketVersionHeader, MethodNotGet, WebSocketKeyHeaderMissing,
            WebSocketUpgradeRejection,
        },
    },
    http::{HeaderMap, HeaderName, HeaderValue, Method, StatusCode, header, request::Parts},
    response::Response,
};
use futures_util::{Sink, SinkExt};
use hyper::upgrade::{OnUpgrade, Upgraded};
use hyper_util::rt::TokioIo;
use tokio_tungstenite::{
    WebSocketStream,
    tungstenite::{
        Bytes, Message,
        handshake::derive_accept_key,
        protocol::{
            Role, WebSocketConfig,
            frame::{
                Frame,
                coding::{Data, OpCode},
            },
        },
    },
};

/// An upgraded worker connection.
pub(crate) type WorkerSocket = WebSocketStream<TokioIo<Upgraded>>;

/// Payload bytes in each frame of an outbound JSON envelope larger than one
/// frame: 1 MiB, the fragment size the SDKs use toward the engine.
pub(crate) const JSON_FRAGMENT_BYTES: usize = 1024 * 1024;

/// The frames that carry one serialized JSON envelope to a worker.
///
/// An envelope up to [`JSON_FRAGMENT_BYTES`] is one text frame. A larger one
/// is one fragmented text message (RFC 6455 section 5.4): a non-final text
/// frame, then continuation frames, the last one final, each at most
/// [`JSON_FRAGMENT_BYTES`]. A boundary may split a multibyte UTF-8 character;
/// receivers validate the reassembled message, not each frame.
///
/// Fragmenting matters for two reasons. A receiver keeping tungstenite's
/// default 16 MiB `max_frame_size` (Rust SDK 0.24.4 and older) rejects a
/// larger single frame and drops the connection, failing everything in flight
/// on it. And tungstenite's write buffer keeps the capacity of the largest
/// frame it has written until the connection closes, so with one frame per
/// envelope every connection held as much memory as the largest envelope ever
/// sent to it.
pub(crate) fn json_frames(payload: String) -> Vec<Message> {
    if payload.len() <= JSON_FRAGMENT_BYTES {
        return vec![Message::Text(payload.into())];
    }

    let payload = Bytes::from(payload);
    (0..payload.len())
        .step_by(JSON_FRAGMENT_BYTES)
        .map(|offset| {
            let end = (offset + JSON_FRAGMENT_BYTES).min(payload.len());
            let opcode = if offset == 0 {
                Data::Text
            } else {
                Data::Continue
            };
            Message::Frame(Frame::message(
                payload.slice(offset..end),
                OpCode::Data(opcode),
                end == payload.len(),
            ))
        })
        .collect()
}

/// Writes one serialized JSON envelope as [`json_frames`]. The connection's
/// single writer task calls it, so no other data frame can land between the
/// fragments of a message.
pub(crate) async fn send_json<S>(sink: &mut S, payload: String) -> Result<(), S::Error>
where
    S: Sink<Message> + Unpin,
{
    for frame in json_frames(payload) {
        sink.send(frame).await?;
    }
    Ok(())
}

/// WebSocket upgrade for the worker endpoint. It accepts and rejects requests
/// exactly as axum's `WebSocketUpgrade` does on HTTP/1.1 (the only version the
/// worker listener serves), but hands the connection over as a
/// tokio-tungstenite stream, which can write individual frames.
pub(crate) struct WorkerSocketUpgrade {
    config: WebSocketConfig,
    sec_websocket_key: HeaderValue,
    on_upgrade: OnUpgrade,
}

impl<S> FromRequestParts<S> for WorkerSocketUpgrade
where
    S: Send + Sync,
{
    type Rejection = WebSocketUpgradeRejection;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        if parts.method != Method::GET {
            return Err(MethodNotGet::default().into());
        }
        if !header_contains(&parts.headers, header::CONNECTION, "upgrade") {
            return Err(InvalidConnectionHeader::default().into());
        }
        if !header_eq(&parts.headers, header::UPGRADE, "websocket") {
            return Err(InvalidUpgradeHeader::default().into());
        }
        let sec_websocket_key = parts
            .headers
            .get(header::SEC_WEBSOCKET_KEY)
            .ok_or_else(WebSocketKeyHeaderMissing::default)?
            .clone();
        if !header_eq(&parts.headers, header::SEC_WEBSOCKET_VERSION, "13") {
            return Err(InvalidWebSocketVersionHeader::default().into());
        }
        let on_upgrade = parts
            .extensions
            .remove::<OnUpgrade>()
            .ok_or_else(ConnectionNotUpgradable::default)?;

        Ok(Self {
            config: WebSocketConfig::default(),
            sec_websocket_key,
            on_upgrade,
        })
    }
}

impl WorkerSocketUpgrade {
    /// Largest frame payload the engine reads from the worker.
    pub(crate) fn max_frame_size(mut self, max: usize) -> Self {
        self.config = self.config.max_frame_size(Some(max));
        self
    }

    /// Largest message the engine reads from the worker.
    pub(crate) fn max_message_size(mut self, max: usize) -> Self {
        self.config = self.config.max_message_size(Some(max));
        self
    }

    /// Answers `101 Switching Protocols` and runs `callback` with the
    /// connection once the client has switched.
    pub(crate) fn on_upgrade<C, Fut>(self, callback: C) -> Response
    where
        C: FnOnce(WorkerSocket) -> Fut + Send + 'static,
        Fut: Future<Output = ()> + Send + 'static,
    {
        let on_upgrade = self.on_upgrade;
        let config = self.config;
        tokio::spawn(async move {
            let upgraded = match on_upgrade.await {
                Ok(upgraded) => upgraded,
                Err(err) => {
                    tracing::debug!(error = ?err, "worker WebSocket upgrade failed");
                    return;
                }
            };
            let socket = WebSocketStream::from_raw_socket(
                TokioIo::new(upgraded),
                Role::Server,
                Some(config),
            )
            .await;
            callback(socket).await;
        });

        Response::builder()
            .status(StatusCode::SWITCHING_PROTOCOLS)
            .header(header::CONNECTION, HeaderValue::from_static("upgrade"))
            .header(header::UPGRADE, HeaderValue::from_static("websocket"))
            .header(
                header::SEC_WEBSOCKET_ACCEPT,
                derive_accept_key(self.sec_websocket_key.as_bytes()),
            )
            .body(Body::empty())
            .expect("static 101 response is valid")
    }
}

fn header_eq(headers: &HeaderMap, key: HeaderName, value: &'static str) -> bool {
    headers
        .get(&key)
        .is_some_and(|header| header.as_bytes().eq_ignore_ascii_case(value.as_bytes()))
}

fn header_contains(headers: &HeaderMap, key: HeaderName, value: &'static str) -> bool {
    headers
        .get(&key)
        .and_then(|header| std::str::from_utf8(header.as_bytes()).ok())
        .is_some_and(|header| header.to_ascii_lowercase().contains(value))
}

#[cfg(test)]
mod tests {
    use super::*;

    const MIB: usize = 1024 * 1024;

    fn frame_parts(frames: &[Message]) -> Vec<(OpCode, bool, &[u8])> {
        frames
            .iter()
            .map(|frame| match frame {
                Message::Frame(frame) => (
                    frame.header().opcode,
                    frame.header().is_final,
                    frame.payload(),
                ),
                other => panic!("expected a raw data frame, got {other:?}"),
            })
            .collect()
    }

    #[test]
    fn envelope_up_to_one_fragment_is_a_single_text_frame() {
        for size in [0, 1, JSON_FRAGMENT_BYTES - 1, JSON_FRAGMENT_BYTES] {
            let payload = "x".repeat(size);
            let frames = json_frames(payload.clone());
            assert_eq!(frames.len(), 1, "size {size}");
            match &frames[0] {
                Message::Text(text) => assert_eq!(text.as_str(), payload),
                other => panic!("size {size}: expected a text frame, got {other:?}"),
            }
        }
    }

    #[test]
    fn larger_envelope_is_one_fragmented_text_message_of_1_mib_frames() {
        for size in [
            JSON_FRAGMENT_BYTES + 1,
            16 * MIB,
            16 * MIB + 1,
            40 * MIB + 7,
            crate::workers::worker::MAX_JSON_MESSAGE_BYTES,
        ] {
            let payload: String = (0..size)
                .map(|index| char::from(b'a' + (index % 26) as u8))
                .collect();
            let frames = json_frames(payload.clone());
            let parts = frame_parts(&frames);
            assert_eq!(
                parts.len(),
                size.div_ceil(JSON_FRAGMENT_BYTES),
                "size {size}"
            );
            for (index, (opcode, is_final, data)) in parts.iter().enumerate() {
                let last = index + 1 == parts.len();
                let expected_opcode = if index == 0 {
                    Data::Text
                } else {
                    Data::Continue
                };
                assert_eq!(
                    *opcode,
                    OpCode::Data(expected_opcode),
                    "size {size} frame {index}"
                );
                assert_eq!(*is_final, last, "size {size} frame {index}");
                assert!(data.len() <= JSON_FRAGMENT_BYTES);
                if !last {
                    assert_eq!(data.len(), JSON_FRAGMENT_BYTES);
                }
            }
            let reassembled: Vec<u8> = parts.iter().flat_map(|part| part.2).copied().collect();
            assert_eq!(reassembled, payload.as_bytes(), "size {size}");
        }
    }

    #[test]
    fn fragment_boundary_may_split_a_multibyte_character() {
        // "é" is 2 bytes and "😀" 4, so after a 1-byte prefix the first
        // 1 MiB boundary falls inside a character.
        let payload = format!("x{}", "é😀".repeat(400_000));
        assert!(!payload.is_char_boundary(JSON_FRAGMENT_BYTES));
        let frames = json_frames(payload.clone());
        let parts = frame_parts(&frames);
        assert!(parts.len() > 1);
        assert!(std::str::from_utf8(parts[0].2).is_err());
        let reassembled: Vec<u8> = parts.iter().flat_map(|part| part.2).copied().collect();
        assert_eq!(String::from_utf8(reassembled).unwrap(), payload);
    }

    mod connection {
        use std::{net::SocketAddr, sync::Arc, time::Duration};

        use futures_util::StreamExt;
        use serde_json::Value;
        use tokio::net::TcpListener;
        use tokio_tungstenite::tungstenite::{Error, Message, protocol::WebSocketConfig};
        use uuid::Uuid;

        use super::{JSON_FRAGMENT_BYTES, MIB};
        use crate::{
            engine::{Engine, Outbound},
            protocol,
            workers::worker::{
                AppState, MAX_JSON_FRAME_BYTES, MAX_JSON_MESSAGE_BYTES, WorkerManagerConfig,
                worker_router,
            },
        };

        type Client = tokio_tungstenite::WebSocketStream<
            tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
        >;

        async fn serve() -> (SocketAddr, Arc<Engine>) {
            crate::workers::observability::metrics::ensure_default_meter();
            let engine = Arc::new(Engine::new());
            let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
            let state = AppState {
                engine: engine.clone(),
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
            (address, engine)
        }

        async fn next_json(client: &mut Client) -> Result<Value, Error> {
            loop {
                let frame = tokio::time::timeout(Duration::from_secs(60), client.next())
                    .await
                    .expect("timed out waiting for the engine")
                    .expect("connection ended")?;
                match frame {
                    Message::Text(text) => return Ok(serde_json::from_str(&text).unwrap()),
                    Message::Ping(_) | Message::Pong(_) => continue,
                    other => panic!("unexpected frame {other:?}"),
                }
            }
        }

        /// Connects a worker whose WebSocket reads with `config`, then sends it
        /// one `invocationresult` carrying `result`, with the receive limit
        /// raised to 64 MiB as for a target the engine classifies 64 MiB.
        async fn deliver(config: WebSocketConfig, result: &str) -> (Client, Result<Value, Error>) {
            let (address, engine) = serve().await;
            let (mut client, _) = tokio_tungstenite::connect_async_with_config(
                format!("ws://{address}/"),
                Some(config),
                true,
            )
            .await
            .unwrap();
            let registered = next_json(&mut client).await.unwrap();
            assert_eq!(registered["type"], "workerregistered");
            let worker_id: Uuid = registered["worker_id"].as_str().unwrap().parse().unwrap();
            let worker = engine.worker_registry.get_worker(&worker_id).unwrap();
            worker
                .receive_message_limit
                .store(MAX_JSON_MESSAGE_BYTES, std::sync::atomic::Ordering::Relaxed);

            let invocation_id = Uuid::new_v4();
            worker
                .channel
                .send(Outbound::Protocol(protocol::Message::InvocationResult {
                    invocation_id,
                    function_id: "test::large".to_string(),
                    result: Some(Value::String(result.to_string())),
                    error: None,
                    traceparent: None,
                    baggage: None,
                }))
                .await
                .unwrap();
            let received = next_json(&mut client).await;
            if let Ok(message) = &received {
                assert_eq!(message["invocation_id"], invocation_id.to_string());
            }
            (client, received)
        }

        #[tokio::test]
        async fn upgrade_rejects_requests_as_axum_does() {
            use tokio::io::{AsyncReadExt, AsyncWriteExt};

            let (address, _engine) = serve().await;
            let key = "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n";
            let cases = [
                (
                    String::new(),
                    "400 Bad Request",
                    "Connection header did not include 'upgrade'",
                ),
                (
                    "Connection: Upgrade\r\nUpgrade: h2c\r\n".to_string(),
                    "400 Bad Request",
                    "`Upgrade` header did not include 'websocket'",
                ),
                (
                    "Connection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\n"
                        .to_string(),
                    "400 Bad Request",
                    "`Sec-WebSocket-Key` header missing",
                ),
                (
                    format!(
                        "Connection: Upgrade\r\nUpgrade: websocket\r\n{key}Sec-WebSocket-Version: 8\r\n"
                    ),
                    "400 Bad Request",
                    "`Sec-WebSocket-Version` header did not include '13'",
                ),
            ];
            for (headers, status, body) in cases {
                let mut stream = tokio::net::TcpStream::connect(address).await.unwrap();
                stream
                    .write_all(
                        format!("GET / HTTP/1.1\r\nHost: engine\r\n{headers}\r\n").as_bytes(),
                    )
                    .await
                    .unwrap();
                let mut response = Vec::new();
                let mut buffer = [0u8; 1024];
                while !String::from_utf8_lossy(&response).contains(body) {
                    let read =
                        tokio::time::timeout(Duration::from_secs(5), stream.read(&mut buffer))
                            .await
                            .unwrap_or_else(|_| {
                                panic!("no {body:?} in {:?}", String::from_utf8_lossy(&response))
                            })
                            .unwrap();
                    assert!(read > 0, "closed: {:?}", String::from_utf8_lossy(&response));
                    response.extend_from_slice(&buffer[..read]);
                }
                let response = String::from_utf8_lossy(&response);
                assert!(
                    response.starts_with(&format!("HTTP/1.1 {status}\r\n")),
                    "{response}"
                );
            }
        }

        /// The read limits of tokio-tungstenite's defaults, which Rust SDK
        /// 0.24.4 and older connect with.
        fn tungstenite_defaults() -> WebSocketConfig {
            WebSocketConfig::default()
                .max_frame_size(Some(MAX_JSON_FRAME_BYTES))
                .max_message_size(Some(MAX_JSON_MESSAGE_BYTES))
        }

        #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
        async fn worker_with_16_mib_frame_limit_receives_40_mib_message_and_stays_connected() {
            let payload = "x".repeat(40 * MIB);
            let (mut client, received) = deliver(tungstenite_defaults(), &payload).await;
            let message = received.expect("a 16 MiB frame limit must not reject the message");
            assert_eq!(message["result"].as_str().unwrap().len(), payload.len());
            assert!(message["result"] == payload.as_str());

            // The connection is still usable afterwards.
            futures_util::SinkExt::send(&mut client, Message::Ping(b"alive".to_vec().into()))
                .await
                .unwrap();
            let pong = tokio::time::timeout(Duration::from_secs(5), client.next())
                .await
                .unwrap()
                .unwrap()
                .unwrap();
            assert_eq!(pong, Message::Pong(b"alive".to_vec().into()));
        }

        #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
        async fn large_message_arrives_in_frames_of_at_most_1_mib_and_reassembles_exactly() {
            // A reader that refuses any frame over 1 MiB still receives the
            // whole 40 MiB message, so every frame was at most 1 MiB. "é😀"
            // repeats every 6 bytes while 1 MiB boundaries advance by 4 (mod
            // 6), so some boundary splits a character whatever the offset of
            // the result inside the envelope.
            let config = WebSocketConfig::default()
                .max_frame_size(Some(JSON_FRAGMENT_BYTES))
                .max_message_size(Some(MAX_JSON_MESSAGE_BYTES));
            let payload = "é😀".repeat(40 * MIB / 6);
            let (_client, received) = deliver(config, &payload).await;
            let message = received.expect("every frame must fit in 1 MiB");
            assert!(message["result"] == payload.as_str());
        }
    }
}
