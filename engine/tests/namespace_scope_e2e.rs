//! End-to-end proof that a session scoped to some namespaces can't run a worker
//! in another one: the engine refuses the declaration with `NAMESPACE_FORBIDDEN`
//! and closes the connection, instead of leaving the worker serving from
//! `default`.
//!
//! The worker announces itself the way the SDKs do, with a fire-and-forget
//! `engine::workers::register` (no invocation id), so an invocation error alone
//! would never be read.

use std::sync::Arc;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use iii::engine::{Engine, EngineTrait, Handler, RegisterFunctionRequest};
use iii::function::FunctionResult;
use iii::protocol::ErrorBody;
use iii::workers::engine_fn::EngineFunctionsWorker;
use iii::workers::traits::Worker;
use iii::workers::worker::WorkerManager;
use serde_json::{Value, json};
use tokio::net::TcpListener;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tokio_tungstenite::tungstenite::Message as WsMessage;

type Client = WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>;
type HandlerFuture = std::pin::Pin<
    Box<dyn std::future::Future<Output = FunctionResult<Option<Value>, ErrorBody>> + Send>,
>;

/// An engine whose auth function scopes every session to the `orders` namespace.
async fn spawn_scoped_engine() -> (u16, Arc<Engine>) {
    iii::workers::observability::metrics::ensure_default_meter();

    let probe = TcpListener::bind("127.0.0.1:0").await.expect("bind probe");
    let port = probe.local_addr().expect("local_addr").port();
    drop(probe);

    let engine = Arc::new(Engine::new());
    engine.register_function_handler(
        RegisterFunctionRequest {
            function_id: "test::auth".to_string(),
            description: None,
            request_format: None,
            response_format: None,
            metadata: None,
        },
        Handler::new(|_input: Value| {
            Box::pin(async {
                FunctionResult::Success(Some(json!({ "namespaces": { "orders": ["*"] } })))
            }) as HandlerFuture
        }),
    );

    let engine_fn = EngineFunctionsWorker::create(engine.clone(), None)
        .await
        .expect("create EngineFunctionsWorker");
    engine_fn
        .initialize()
        .await
        .expect("initialize EngineFunctionsWorker");
    engine_fn.register_functions(engine.clone());

    let manager = WorkerManager::create(
        engine.clone(),
        Some(json!({
            "port": port,
            "host": "127.0.0.1",
            "rbac": { "auth_function_id": "test::auth" },
        })),
    )
    .await
    .expect("create WorkerManager");

    let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
    manager
        .start_background_tasks(shutdown_rx, shutdown_tx)
        .await
        .expect("start WorkerManager");

    (port, engine)
}

async fn connect(port: u16) -> Client {
    let (mut ws, _) = tokio_tungstenite::connect_async(format!("ws://127.0.0.1:{port}/"))
        .await
        .expect("connect to / should succeed");
    let frame = tokio::time::timeout(Duration::from_secs(5), ws.next())
        .await
        .expect("WorkerRegistered should arrive")
        .expect("stream should yield")
        .expect("frame should decode");
    let msg: Value = serde_json::from_str(frame.to_text().expect("text frame")).expect("json");
    assert_eq!(msg["type"], "workerregistered");
    ws
}

/// `engine::workers::register` the way the SDKs send it: void, no invocation id.
async fn announce(ws: &mut Client, name: &str, namespace: &str) {
    ws.send(WsMessage::Text(
        json!({
            "type": "invokefunction",
            "function_id": "engine::workers::register",
            "data": { "runtime": "node", "name": name, "namespace": namespace },
            "action": { "type": "void" },
        })
        .to_string()
        .into(),
    ))
    .await
    .expect("send engine::workers::register");
}

/// The next `registrationrejected` frame, then whether the engine closed the socket.
async fn rejection_then_close(ws: &mut Client) -> (Option<Value>, bool) {
    let mut rejection = None;
    let closed = tokio::time::timeout(Duration::from_secs(5), async {
        loop {
            match ws.next().await {
                Some(Ok(WsMessage::Text(text))) => {
                    let msg: Value = serde_json::from_str(&text).expect("json");
                    if msg["type"] == "registrationrejected" {
                        rejection = Some(msg);
                    }
                }
                Some(Ok(WsMessage::Close(_))) | Some(Err(_)) | None => return true,
                Some(Ok(_)) => {}
            }
        }
    })
    .await
    .unwrap_or(false);
    (rejection, closed)
}

#[tokio::test]
async fn a_namespace_outside_the_session_scope_is_rejected_and_closed() {
    let (port, _engine) = spawn_scoped_engine().await;
    let mut ws = connect(port).await;

    announce(&mut ws, "billing", "billing").await;

    let (rejection, closed) = rejection_then_close(&mut ws).await;
    let rejection = rejection.expect("the worker must receive RegistrationRejected");
    assert_eq!(rejection["code"], "NAMESPACE_FORBIDDEN");
    assert_eq!(rejection["namespace"], "billing");
    assert_eq!(rejection["worker_name"], "billing");
    assert!(
        closed,
        "the engine must close the rejected worker's connection"
    );
}

/// The attack the fix must stop: register a function while the namespace is still
/// pending, announce a forbidden namespace, then never close. The buffered
/// registration must not drain into `default` when the grace timer fires.
#[tokio::test]
async fn a_rejected_worker_that_ignores_close_never_registers_into_default() {
    let (port, engine) = spawn_scoped_engine().await;
    engine.set_registration_namespace_grace_ms(100);
    let mut ws = connect(port).await;

    ws.send(WsMessage::Text(
        json!({ "type": "registerfunction", "id": "billing::charge" })
            .to_string()
            .into(),
    ))
    .await
    .expect("send registerfunction");
    announce(&mut ws, "billing", "billing").await;

    // Hold the socket without reading or closing, well past the grace.
    tokio::time::sleep(Duration::from_millis(500)).await;
    assert!(
        engine.functions.get("default", "billing::charge").is_none(),
        "a rejected worker's buffered registration must not land in default"
    );
    drop(ws);
}

#[tokio::test]
async fn a_namespace_inside_the_session_scope_registers() {
    let (port, engine) = spawn_scoped_engine().await;
    let mut ws = connect(port).await;

    announce(&mut ws, "api", "orders").await;

    let registered = tokio::time::timeout(Duration::from_secs(2), async {
        loop {
            let found = engine.worker_registry.list_workers().iter().any(|w| {
                w.name.as_deref() == Some("api") && w.namespace.as_deref() == Some("orders")
            });
            if found {
                return;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await;
    assert!(registered.is_ok(), "a permitted namespace must register");

    let _ = ws.close(None).await;
}
