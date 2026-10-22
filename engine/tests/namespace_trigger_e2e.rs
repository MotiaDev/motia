//! End-to-end proof that a fired trigger reaches the function in the namespace
//! of the worker that REGISTERED the trigger — not a same-named function that
//! happens to live in `default`.
//!
//! The bug this guards: `Engine::fire_triggers` dispatched every trigger through
//! a path that resolved the target function unconditionally in `default`. A
//! worker in namespace `orders` that registered `state::set` and a trigger for
//! it would, at fire time, silently execute the `state::set` of a DIFFERENT
//! worker in `default`. Not "not found" — the wrong function, no error.
//!
//! Everything here drives the real `WorkerManager` axum router over live
//! WebSockets, in the message order the SDKs use. Nothing hand-builds a
//! `Trigger` and pokes `.namespace`: each `RegisterTrigger` names its target
//! namespace explicitly (absent, the engine resolves the target in `default`),
//! and the fire is driven through the real `Engine::fire_triggers`. Reverting
//! the fix turns the decisive test RED with the `default` worker receiving the
//! invocation.

use std::sync::Arc;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use iii::engine::Engine;
use iii::function::FunctionResult;
use iii::protocol::DEFAULT_NAMESPACE;
use iii::workers::engine_fn::{EngineFunctionsWorker, TRIGGER_FUNCTIONS_AVAILABLE};
use iii::workers::traits::Worker;
use iii::workers::worker::WorkerManager;
use serde_json::{Value, json};
use tokio::net::TcpListener;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tokio_tungstenite::tungstenite::Message as WsMessage;

type Client = WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>;

async fn spawn_engine() -> (u16, Arc<Engine>) {
    iii::workers::observability::metrics::ensure_default_meter();

    let probe = TcpListener::bind("127.0.0.1:0").await.expect("bind probe");
    let port = probe.local_addr().expect("local_addr").port();
    drop(probe);

    let engine = Arc::new(Engine::new());

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
        Some(json!({ "port": port, "host": "127.0.0.1" })),
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

async fn eventually(mut f: impl FnMut() -> bool) -> bool {
    tokio::time::timeout(Duration::from_secs(2), async {
        loop {
            if f() {
                return;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .is_ok()
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

async fn send_register_worker(ws: &mut Client, name: &str, namespace: Option<&str>) {
    let mut data = json!({ "runtime": "node", "name": name });
    if let Some(ns) = namespace {
        data["namespace"] = json!(ns);
    }
    ws.send(WsMessage::Text(
        json!({
            "type": "invokefunction",
            "invocation_id": uuid::Uuid::new_v4(),
            "function_id": "engine::workers::register",
            "data": data,
        })
        .to_string()
        .into(),
    ))
    .await
    .expect("send engine::workers::register");
}

async fn send_register_function(ws: &mut Client, id: &str, description: &str) {
    ws.send(WsMessage::Text(
        json!({
            "type": "registerfunction",
            "id": id,
            "description": description,
            "request_format": null,
            "response_format": null,
        })
        .to_string()
        .into(),
    ))
    .await
    .expect("send RegisterFunction");
}

async fn send_register_trigger(
    ws: &mut Client,
    namespace: &str,
    id: &str,
    trigger_type: &str,
    function_id: &str,
) {
    // The trigger's target namespace is named in the message; absent, the engine
    // would resolve the target in `default` rather than the worker's namespace.
    ws.send(WsMessage::Text(
        json!({
            "type": "registertrigger",
            "id": id,
            "trigger_type": trigger_type,
            "function_id": function_id,
            "config": {},
            "namespace": namespace,
        })
        .to_string()
        .into(),
    ))
    .await
    .expect("send RegisterTrigger");
}

/// Reads frames until an `InvokeFunction` for `function_id` arrives, or the
/// deadline passes. `true` means this connection was asked to run the function.
async fn received_invoke(ws: &mut Client, function_id: &str) -> bool {
    tokio::time::timeout(Duration::from_secs(3), async {
        while let Some(Ok(frame)) = ws.next().await {
            let WsMessage::Text(text) = &frame else {
                continue;
            };
            let Ok(msg): Result<Value, _> = serde_json::from_str(text) else {
                continue;
            };
            if msg["type"] == "invokefunction" && msg["function_id"] == function_id {
                return true;
            }
        }
        false
    })
    .await
    .unwrap_or(false)
}

/// Calls an engine introspection function in-process. Content still comes from
/// the registries the real WebSocket path populated.
async fn call_engine_fn(engine: &Arc<Engine>, function_id: &str, input: Value) -> Value {
    let function = engine
        .functions
        .get(DEFAULT_NAMESPACE, function_id)
        .unwrap_or_else(|| panic!("{function_id} should be registered"));
    match function.call_handler(None, input, None).await {
        FunctionResult::Success(Some(value)) => value,
        _ => panic!("{function_id} should return a result"),
    }
}

/// A registered trigger's introspection detail must resolve its target function
/// in the trigger's own namespace — not `default`. Before the fix,
/// `engine::registered-triggers::info` resolved the target in `default`
/// (the `TRIGGER_TARGET_NAMESPACE` const), so a trigger whose target lives in
/// `orders` reported a null `function` detail.
#[tokio::test]
async fn registered_trigger_info_resolves_its_target_in_the_triggers_namespace() {
    let (port, engine) = spawn_engine().await;

    let mut orders = connect(port).await;
    send_register_worker(&mut orders, "orders-worker", Some("orders")).await;
    send_register_function(&mut orders, "orders::handler", "the orders handler").await;
    send_register_trigger(
        &mut orders,
        "orders",
        "t-info",
        TRIGGER_FUNCTIONS_AVAILABLE,
        "orders::handler",
    )
    .await;

    assert!(
        eventually(
            || engine.functions.get("orders", "orders::handler").is_some()
                && engine.trigger_registry.triggers.contains_key("t-info")
        )
        .await,
        "the orders function and trigger must register"
    );

    let result = call_engine_fn(
        &engine,
        "engine::registered-triggers::info",
        json!({ "id": "t-info" }),
    )
    .await;

    assert_eq!(
        result["function"]["namespace"],
        json!("orders"),
        "the target function detail must resolve in the trigger's namespace; got: {result}"
    );
    assert_eq!(
        result["function"]["worker_name"],
        json!("orders-worker"),
        "the target function must be attributed to its real owner; got: {result}"
    );

    let _ = orders.close(None).await;
}

/// The decisive case. Two workers register the SAME function id `state::set` —
/// one in `orders`, one in `default`. A trigger registered by the `orders`
/// worker must, when fired, invoke the `orders` copy — the worker that
/// registered the trigger — never the `default` one.
#[tokio::test]
async fn fired_trigger_invokes_the_function_in_the_registering_workers_namespace() {
    let (port, engine) = spawn_engine().await;

    // orders worker: state::set + a functions-available trigger for it.
    let mut orders = connect(port).await;
    send_register_worker(&mut orders, "orders-worker", Some("orders")).await;
    send_register_function(&mut orders, "state::set", "from-orders").await;
    send_register_trigger(
        &mut orders,
        "orders",
        "t-orders",
        TRIGGER_FUNCTIONS_AVAILABLE,
        "state::set",
    )
    .await;

    // default worker: the same id, in default.
    let mut default = connect(port).await;
    send_register_worker(&mut default, "default-worker", None).await;
    send_register_function(&mut default, "state::set", "from-default").await;

    assert!(
        eventually(|| engine.functions.get("orders", "state::set").is_some()
            && engine.functions.get("default", "state::set").is_some()
            && engine.trigger_registry.triggers.contains_key("t-orders"))
        .await,
        "both functions and the trigger must register"
    );

    engine
        .fire_triggers(TRIGGER_FUNCTIONS_AVAILABLE, json!({ "event": "test" }))
        .await;

    // The orders worker — the one that registered the trigger — must be the one
    // asked to run state::set.
    assert!(
        received_invoke(&mut orders, "state::set").await,
        "the trigger's own namespace (orders) must receive the invocation"
    );
    // And the default worker's identically-named function must NOT be invoked.
    assert!(
        !received_invoke(&mut default, "state::set").await,
        "the default worker's same-named function must NOT be fired by an orders trigger"
    );

    let _ = orders.close(None).await;
    let _ = default.close(None).await;
}

/// The load-bearing coupling: a `RegisterTrigger` that arrives BEFORE
/// `engine::workers::register` must still resolve in the worker's real
/// namespace once the buffer drains — not `default`. If `RegisterTrigger` were
/// left out of the registration buffer, its namespace would be captured as
/// `default` (unknown at arrival) and the bug would return.
#[tokio::test]
async fn trigger_registered_before_workers_register_resolves_in_the_real_namespace() {
    let (port, engine) = spawn_engine().await;

    let mut orders = connect(port).await;
    // Function + trigger flushed BEFORE the namespace-bearing workers::register,
    // exactly as an SDK that predates the reorder does.
    send_register_function(&mut orders, "state::set", "from-orders").await;
    send_register_trigger(
        &mut orders,
        "orders",
        "t-early",
        TRIGGER_FUNCTIONS_AVAILABLE,
        "state::set",
    )
    .await;
    send_register_worker(&mut orders, "orders-worker", Some("orders")).await;

    let mut default = connect(port).await;
    send_register_worker(&mut default, "default-worker", None).await;
    send_register_function(&mut default, "state::set", "from-default").await;

    assert!(
        eventually(|| engine.trigger_registry.triggers.contains_key("t-early")
            && engine.functions.get("orders", "state::set").is_some()
            && engine.functions.get("default", "state::set").is_some())
        .await,
        "the buffered function and trigger must drain and register"
    );

    // The trigger the buffer drained must carry the real namespace, captured at
    // the point it was actually applied — not the `default` that was in force
    // when the message arrived.
    let ns = engine
        .trigger_registry
        .triggers
        .get("t-early")
        .expect("t-early registered")
        .namespace
        .clone();
    assert_eq!(
        ns, "orders",
        "a trigger buffered before workers::register must resolve in the drained namespace"
    );

    engine
        .fire_triggers(TRIGGER_FUNCTIONS_AVAILABLE, json!({ "event": "test" }))
        .await;

    assert!(
        received_invoke(&mut orders, "state::set").await,
        "the early-registered trigger must still fire the orders function"
    );
    assert!(
        !received_invoke(&mut default, "state::set").await,
        "the default worker's same-named function must NOT be fired"
    );

    let _ = orders.close(None).await;
    let _ = default.close(None).await;
}

/// The function path. A namespaced worker that calls `engine::register_trigger`
/// over the wire (the engine injects `_caller_worker_id`) must get a LIVE
/// binding at home in its own namespace, and a fire must reach its function
/// there. Before the fix every namespace field was hardcoded to `default`: the
/// provider was never looked for at home, so the registration parked in
/// `pending_triggers` for good while the call still returned success — and a
/// fire, had one happened, would have resolved the target in `default`.
#[tokio::test]
async fn function_path_register_trigger_binds_in_the_callers_namespace() {
    let (port, engine) = spawn_engine().await;

    let mut orders = connect(port).await;
    send_register_worker(&mut orders, "orders-worker", Some("orders")).await;
    send_register_function(&mut orders, "orders::wake", "from-orders").await;
    orders
        .send(WsMessage::Text(
            json!({
                "type": "invokefunction",
                "invocation_id": uuid::Uuid::new_v4(),
                "function_id": "engine::register_trigger",
                "data": {
                    "trigger_type": TRIGGER_FUNCTIONS_AVAILABLE,
                    "function_id": "orders::wake",
                    "config": {},
                },
            })
            .to_string()
            .into(),
        ))
        .await
        .expect("send engine::register_trigger");

    // A same-named function in `default` must NOT be the one fired.
    let mut default = connect(port).await;
    send_register_worker(&mut default, "default-worker", None).await;
    send_register_function(&mut default, "orders::wake", "from-default").await;

    let live_binding = || {
        engine
            .trigger_registry
            .triggers
            .iter()
            .find(|t| t.function_id == "orders::wake")
            .map(|t| t.value().clone())
    };
    assert!(
        eventually(|| live_binding().is_some()
            && engine.functions.get("default", "orders::wake").is_some())
        .await,
        "the function-path registration must go live, not park in pending_triggers"
    );
    assert!(engine.trigger_registry.pending_triggers.is_empty());
    let trigger = live_binding().expect("live binding");
    assert_eq!(
        trigger.namespace, "orders",
        "target resolves in the caller's namespace"
    );
    assert_eq!(
        trigger.home_namespace, "orders",
        "provider lookup starts at home"
    );

    let info = call_engine_fn(
        &engine,
        "engine::registered-triggers::info",
        json!({ "id": trigger.id }),
    )
    .await;
    assert_eq!(info["status"], json!("active"), "got: {info}");
    assert_eq!(
        info["function"]["namespace"],
        json!("orders"),
        "got: {info}"
    );

    engine
        .fire_triggers(TRIGGER_FUNCTIONS_AVAILABLE, json!({ "event": "test" }))
        .await;

    assert!(
        received_invoke(&mut orders, "orders::wake").await,
        "the registering worker's own function must receive the fire"
    );
    assert!(
        !received_invoke(&mut default, "orders::wake").await,
        "the default worker's same-named function must NOT be fired"
    );

    let _ = orders.close(None).await;
    let _ = default.close(None).await;
}

// KAN-319 fixtures implement only the approved engine wire contract. They are
// not production HTTP/cron adapters and do not exercise the firing gateway.
async fn assignment_send(ws: &mut Client, value: Value) {
    ws.send(WsMessage::Text(value.to_string().into()))
        .await
        .expect("send assignment fixture message");
}

async fn assignment_frame(ws: &mut Client, kind: &str) -> Value {
    tokio::time::timeout(Duration::from_secs(2), async {
        while let Some(frame) = ws.next().await {
            let frame = frame.expect("assignment socket frame");
            if let WsMessage::Text(text) = frame {
                let value: Value = serde_json::from_str(&text).expect("assignment json");
                if value["type"] == kind {
                    return value;
                }
            }
        }
        panic!("provider socket closed before {kind}");
    })
    .await
    .unwrap_or_else(|_| panic!("missing {kind}: shared_v1 must deliver parallel assignments without waiting on its own read-loop ack"))
}

/// A Pong fences all earlier input on this socket. Preserve unexpected frames
/// so a negative replay assertion cannot silently consume an extra assignment.
async fn assignment_barrier(ws: &mut Client) -> Vec<Value> {
    assignment_send(ws, json!({"type":"ping"})).await;
    tokio::time::timeout(Duration::from_secs(2), async {
        let mut frames = Vec::new();
        while let Some(frame) = ws.next().await {
            if let WsMessage::Text(text) = frame.expect("barrier frame") {
                let value: Value = serde_json::from_str(&text).unwrap();
                if value["type"] == "pong" {
                    return frames;
                }
                frames.push(value);
            }
        }
        panic!("provider closed before barrier");
    })
    .await
    .expect("provider read loop must stay available for installation/stop acks")
}

fn parallel_declaration() -> Value {
    json!({"type":"registertriggertype", "id":"fixture:parallel", "description":"parallel route fixture",
        "delivery_mode":"parallel", "delivery_contract":"shared_v1"})
}

async fn assignment_providers() -> (Arc<Engine>, Client, Client, tempfile::TempDir) {
    use iii::workers::config::{EngineConfig, WorkerEntry};
    let directory = tempfile::tempdir_in(".").unwrap();
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    drop(listener);
    let builder = iii::EngineBuilder::new()
        .with_config(EngineConfig {
            shared_namespace_ownership: true,
            workers: vec![
                WorkerEntry {
                    name: "configuration".into(),
                    image: None,
                    config: Some(
                        json!({"adapter":{"name":"fs","config":{"directory":directory.path()}}}),
                    ),
                },
                WorkerEntry {
                    name: "iii-worker-manager".into(),
                    image: None,
                    config: Some(json!({"host":"127.0.0.1", "port":port})),
                },
            ],
            ..EngineConfig::default()
        })
        .build()
        .await
        .unwrap();
    let engine = builder.engine_handle();
    assert!(engine.shared_namespace_ownership());
    let manager = builder
        .running()
        .iter()
        .find(|worker| worker.entry.name == "iii-worker-manager")
        .unwrap();
    let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
    manager
        .worker
        .start_background_tasks(shutdown_rx, shutdown_tx)
        .await
        .unwrap();
    let mut a = connect(port).await;
    let mut b = connect(port).await;
    send_register_worker(&mut a, "parallel-provider-a", Some("orders")).await;
    send_register_worker(&mut b, "parallel-provider-b", Some("orders")).await;
    assignment_barrier(&mut a).await;
    assignment_barrier(&mut b).await;
    (engine, a, b, directory)
}

async fn assignment_subscribe(ws: &mut Client, alias: &str) {
    assignment_send(
        ws,
        json!({"type":"registertrigger", "id":alias,
        "trigger_type":"fixture:parallel", "function_id":"orders::route", "namespace":"orders",
        "config":{"api_path":"/orders", "http_method":"POST"}}),
    )
    .await;
}

fn assignment_token(frame: &Value) -> &str {
    frame["assignment_id"]
        .as_str()
        .filter(|id| !id.is_empty())
        .unwrap_or_else(|| {
            panic!("shared_v1 requires opaque assignment_id, not enqueue-only success: {frame}")
        })
}

async fn assignment_install(
    ws: &mut Client,
    frame: &Value,
    installed: &mut std::collections::HashMap<String, String>,
) {
    assert_eq!(frame["type"], "registertrigger");
    assert_eq!(frame["config"]["api_path"], "/orders");
    assert_eq!(frame["namespace"], "orders");
    let token = assignment_token(frame).to_owned();
    assert!(
        installed
            .insert(frame["id"].as_str().unwrap().to_owned(), token.clone())
            .is_none(),
        "a provider must not install the same route twice"
    );
    // Positive ack only after this provider's local route table is installed.
    assignment_send(
        ws,
        json!({"type":"triggerregistrationresult", "id":frame["id"],
        "trigger_type":frame["trigger_type"], "function_id":frame["function_id"],
        "assignment_id":token}),
    )
    .await;
}

async fn assignment_stop(
    ws: &mut Client,
    frame: &Value,
    installed: &mut std::collections::HashMap<String, String>,
) {
    assert_eq!(frame["type"], "unregistertrigger");
    let token = assignment_token(frame);
    assert_eq!(
        installed.remove(frame["id"].as_str().unwrap()).as_deref(),
        Some(token),
        "stop must revoke the exact installed assignment"
    );
    // No future deliveries from this fixture are possible after local removal.
    assignment_send(
        ws,
        json!({"type":"unregistertriggerresult", "id":frame["id"],
        "trigger_type":frame["trigger_type"], "assignment_id":token}),
    )
    .await;
}

#[tokio::test]
async fn shared_trigger_parallel_two_real_providers_install_and_stop_same_canonical_route() {
    let (engine, mut a, mut b, _directory) = assignment_providers().await;
    assignment_send(&mut a, parallel_declaration()).await;
    assignment_send(&mut b, parallel_declaration()).await;
    assignment_barrier(&mut a).await;
    assignment_barrier(&mut b).await;

    // The subscriber IS provider A: an inline await would deadlock its own ack.
    assignment_subscribe(&mut a, "route-a").await;
    let (install_a, install_b) = tokio::join!(
        assignment_frame(&mut a, "registertrigger"),
        assignment_frame(&mut b, "registertrigger")
    );
    assert_eq!(
        install_a["id"], install_b["id"],
        "both providers serve one canonical route"
    );
    assert_ne!(
        assignment_token(&install_a),
        assignment_token(&install_b),
        "tokens are per provider assignment"
    );
    let mut routes_a = std::collections::HashMap::new();
    let mut routes_b = std::collections::HashMap::new();
    assignment_install(&mut a, &install_a, &mut routes_a).await;
    let early = assignment_barrier(&mut a).await;
    assert!(
        !early
            .iter()
            .any(|v| v["type"] == "triggerregistrationresult" && v["error"].is_null()),
        "required membership snapshot cannot report success before B installs: {early:?}"
    );
    assignment_install(&mut b, &install_b, &mut routes_b).await;
    assignment_barrier(&mut b).await;
    assert!(
        eventually(|| engine
            .trigger_registry
            .triggers
            .contains_key(install_a["id"].as_str().unwrap()))
        .await
    );

    assignment_send(
        &mut a,
        json!({"type":"unregistertrigger", "id":"route-a", "trigger_type":"fixture:parallel"}),
    )
    .await;
    let (stop_a, stop_b) = tokio::join!(
        assignment_frame(&mut a, "unregistertrigger"),
        assignment_frame(&mut b, "unregistertrigger")
    );
    assignment_stop(&mut a, &stop_a, &mut routes_a).await;
    assignment_stop(&mut b, &stop_b, &mut routes_b).await;
    assignment_barrier(&mut a).await;
    assignment_barrier(&mut b).await;
    assert!(routes_a.is_empty() && routes_b.is_empty());
    assert!(
        eventually(|| !engine
            .trigger_registry
            .triggers
            .contains_key(install_a["id"].as_str().unwrap())
            && engine.trigger_registry.pending_triggers.is_empty())
        .await
    );
    let _ = a.close(None).await;
    let _ = b.close(None).await;
}

#[tokio::test]
async fn shared_trigger_parallel_join_replays_only_new_provider_and_removal_preserves_peer() {
    let (engine, mut a, mut b, _directory) = assignment_providers().await;
    assignment_send(&mut a, parallel_declaration()).await;
    assignment_barrier(&mut a).await;
    assignment_subscribe(&mut a, "join-route").await;
    let first = assignment_frame(&mut a, "registertrigger").await;
    let canonical = first["id"].as_str().unwrap().to_owned();
    let mut routes_a = std::collections::HashMap::new();
    let mut routes_b = std::collections::HashMap::new();
    assignment_install(&mut a, &first, &mut routes_a).await;
    assignment_barrier(&mut a).await;
    assignment_send(&mut b, parallel_declaration()).await;
    let replay = assignment_frame(&mut b, "registertrigger").await;
    assert_eq!(replay["id"], first["id"]);
    assert_ne!(assignment_token(&replay), assignment_token(&first));
    assignment_install(&mut b, &replay, &mut routes_b).await;
    assignment_barrier(&mut b).await;
    assert!(
        !assignment_barrier(&mut a)
            .await
            .iter()
            .any(|v| v["type"] == "registertrigger" || v["type"] == "unregistertrigger"),
        "joining replay must leave incumbent assignment untouched"
    );
    assignment_send(&mut b, parallel_declaration()).await;
    assert!(
        !assignment_barrier(&mut b)
            .await
            .iter()
            .any(|v| v["type"] == "registertrigger"),
        "same-session announcement is idempotent"
    );

    b.close(None).await.unwrap();
    assert!(
        eventually(|| engine
            .worker_registry
            .list_workers()
            .iter()
            .all(|worker| worker.name.as_deref() != Some("parallel-provider-b")))
        .await
    );
    assert!(engine.trigger_registry.triggers.contains_key(&canonical));
    assert_eq!(
        routes_a.get(&canonical).map(String::as_str),
        Some(assignment_token(&first))
    );
    assert!(
        !assignment_barrier(&mut a)
            .await
            .iter()
            .any(|v| v["type"] == "registertrigger" || v["type"] == "unregistertrigger"),
        "removing B must not reinstall or revoke A"
    );
    assignment_send(
        &mut a,
        json!({"type":"unregistertrigger", "id":"join-route"}),
    )
    .await;
    let stop = assignment_frame(&mut a, "unregistertrigger").await;
    assignment_stop(&mut a, &stop, &mut routes_a).await;
    assignment_barrier(&mut a).await;
    let _ = a.close(None).await;
}

#[tokio::test]
async fn shared_trigger_parallel_rejected_copy_cannot_park_healthy_sibling() {
    let (engine, mut a, mut b, _directory) = assignment_providers().await;
    assignment_send(&mut a, parallel_declaration()).await;
    assignment_send(&mut b, parallel_declaration()).await;
    assignment_barrier(&mut a).await;
    assignment_barrier(&mut b).await;
    assignment_subscribe(&mut a, "partial-route").await;
    let (first, second) = tokio::join!(
        assignment_frame(&mut a, "registertrigger"),
        assignment_frame(&mut b, "registertrigger")
    );
    let mut routes_a = std::collections::HashMap::new();
    assignment_install(&mut a, &first, &mut routes_a).await;
    assignment_send(&mut b, json!({"type":"triggerregistrationresult", "id":second["id"],
        "trigger_type":second["trigger_type"], "function_id":second["function_id"],
        "assignment_id":assignment_token(&second), "error":{"code":"install_rejected", "message":"fixture refuses this copy"}})).await;
    assignment_barrier(&mut b).await;
    assignment_barrier(&mut a).await;
    let canonical = first["id"].as_str().unwrap();
    assert!(
        engine.trigger_registry.triggers.contains_key(canonical),
        "one failed copy cannot remove the healthy acknowledged sibling"
    );
    assert!(
        !engine
            .trigger_registry
            .pending_triggers
            .contains_key(canonical),
        "healthy sibling must not become wholly parked"
    );
    assert_eq!(
        routes_a.get(canonical).map(String::as_str),
        Some(assignment_token(&first))
    );
    assignment_send(
        &mut a,
        json!({"type":"unregistertrigger", "id":"partial-route"}),
    )
    .await;
    let stop = assignment_frame(&mut a, "unregistertrigger").await;
    assignment_stop(&mut a, &stop, &mut routes_a).await;
    assignment_barrier(&mut a).await;
    let _ = a.close(None).await;
    let _ = b.close(None).await;
}

// KAN-321: controlled ticks only. The two provider sockets also host the
// balanced target replicas; no timer or broker is implemented by this fixture.
fn single_active_declaration(kind: &str) -> Value {
    json!({"type":"registertriggertype", "id":kind, "description":"single-active tick fixture",
        "delivery_mode":"single_active", "delivery_contract":"shared_v1"})
}

async fn single_active_providers(kind: &str) -> (Arc<Engine>, Client, Client, tempfile::TempDir) {
    let (engine, mut a, mut b, directory) = assignment_providers().await;
    // Registration barriers fix membership order, independently of random UUIDs.
    assignment_send(&mut a, single_active_declaration(kind)).await;
    assignment_barrier(&mut a).await;
    assignment_send(&mut b, single_active_declaration(kind)).await;
    assignment_barrier(&mut b).await;
    send_register_function(&mut a, "orders::route", "balanced target").await;
    send_register_function(&mut b, "orders::route", "balanced target").await;
    assignment_barrier(&mut a).await;
    assignment_barrier(&mut b).await;
    (engine, a, b, directory)
}

async fn single_active_subscribe(ws: &mut Client, alias: &str, kind: &str, event: u64) {
    assignment_send(
        ws,
        json!({"type":"registertrigger", "id":alias,
        "trigger_type":kind, "function_id":"orders::route", "namespace":"orders",
        "config":{"api_path":"/orders", "queue":"orders", "event":event},
        "metadata":{"origin":"registry"}}),
    )
    .await;
}

async fn single_active_ack(ws: &mut Client, install: &Value) {
    let _ = assignment_token(install);
    assignment_send(
        ws,
        json!({"type":"triggerregistrationresult", "id":install["id"],
        "trigger_type":install["trigger_type"], "function_id":install["function_id"],
        "assignment_id":install["assignment_id"]}),
    )
    .await;
}

async fn single_active_registered(ws: &mut Client, alias: &str) {
    let result = assignment_frame(ws, "triggerregistrationresult").await;
    assert_eq!(result["id"], alias);
    assert!(
        result["error"].is_null(),
        "subscriber registration failed: {result}"
    );
}

fn single_active_no_assignment(frames: Vec<Value>) {
    assert!(!frames.iter().any(|frame| frame["type"] == "registertrigger" || frame["type"] == "unregistertrigger"),
        "standby/retry cannot acquire or rotate a sticky assignment: {frames:?}");
}

// Return only after the fire result: every target invocation is recorded and
// answered first. This is the deterministic tick barrier, not a quiet-time sleep.
async fn single_active_fire(
    a: &mut Client,
    b: &mut Client,
    from_a: bool,
    install: &Value,
    token: &str,
    data: Value,
    executions: &mut Vec<(bool, Value)>,
) -> Value {
    let invocation = uuid::Uuid::new_v4().to_string();
    assignment_send(
        if from_a { &mut *a } else { &mut *b },
        json!({
        "type":"invokefunction", "invocation_id":invocation,
        "function_id":"engine::triggers::fire", "data":{
            "id":install["id"], "assignment_id":token, "data":data,
            // These are untrusted input, never routing/sidecar authority.
            "function_id":"evil::target", "metadata":{"origin":"forged"},
            "_caller_worker_id":"00000000-0000-0000-0000-000000000000"
        }}),
    )
    .await;
    tokio::time::timeout(Duration::from_secs(3), async {
        loop {
            let (on_a, frame) = tokio::select! {
                frame = a.next() => (true, frame),
                frame = b.next() => (false, frame),
            };
            let frame = frame.expect("live fire socket").expect("fire frame");
            let WsMessage::Text(text) = frame else {
                continue;
            };
            let value: Value = serde_json::from_str(&text).unwrap();
            if value["type"] == "invocationresult" && value["invocation_id"] == invocation {
                return value;
            }
            assert_eq!(
                value["type"], "invokefunction",
                "unexpected frame during controlled tick: {value}"
            );
            assert_eq!(
                value["function_id"], "orders::route",
                "target must come from registry"
            );
            assert_eq!(
                value["metadata"],
                json!({"origin":"registry"}),
                "metadata must come from registry"
            );
            executions.push((on_a, value["data"].clone()));
            assignment_send(
                if on_a { &mut *a } else { &mut *b },
                json!({
                    "type":"invocationresult", "invocation_id":value["invocation_id"],
                    "function_id":value["function_id"], "result":{"accepted":true}
                }),
            )
            .await;
        }
    })
    .await
    .expect("fire result must fence this controlled tick")
}

fn single_active_stale(result: &Value) {
    assert_eq!(
        result["error"]["code"], "stale_trigger_assignment",
        "fire gateway must reject an uninstalled, foreign, removed or stale assignment (not ordinary invoke failure): {result}"
    );
}

#[tokio::test]
async fn shared_trigger_single_active_two_ws_fire_requires_ack_uuid_and_current_token() {
    let kind = "fixture:single-tick";
    let (engine, mut a, mut b, _directory) = single_active_providers(kind).await;
    single_active_subscribe(&mut a, "tick", kind, 1).await;
    let install = assignment_frame(&mut a, "registertrigger").await;
    let token = assignment_token(&install).to_owned();
    single_active_no_assignment(assignment_barrier(&mut b).await);
    let mut executions = Vec::new();
    let before_ack = single_active_fire(
        &mut a,
        &mut b,
        true,
        &install,
        &token,
        json!({"tick":0}),
        &mut executions,
    )
    .await;
    single_active_stale(&before_ack);
    assert!(
        executions.is_empty(),
        "enqueue-only delivery is not an active assignment"
    );
    single_active_ack(&mut a, &install).await;
    single_active_registered(&mut a, "tick").await;
    let wrong_provider = single_active_fire(
        &mut a,
        &mut b,
        false,
        &install,
        &token,
        json!({"tick":0}),
        &mut executions,
    )
    .await;
    single_active_stale(&wrong_provider);
    // Even with a forged caller UUID in input, the actual provider A succeeds;
    // B above cannot impersonate A. Injection must overwrite user-supplied data.
    for tick in 1..=4 {
        let result = single_active_fire(
            &mut a,
            &mut b,
            true,
            &install,
            &token,
            json!({"tick":tick}),
            &mut executions,
        )
        .await;
        assert!(
            result["error"].is_null(),
            "acknowledged assignment must fire: {result}"
        );
        assert_eq!(
            executions.len(),
            tick as usize,
            "one accepted invocation per controlled event"
        );
    }
    assert_eq!(
        executions.iter().filter(|(on_a, _)| *on_a).count(),
        2,
        "fire uses normal balanced target routing, not owner pinning"
    );
    assert_eq!(
        executions
            .iter()
            .map(|(_, data)| data["tick"].clone())
            .collect::<Vec<_>>(),
        vec![json!(1), json!(2), json!(3), json!(4)]
    );
    let stale = single_active_fire(
        &mut a,
        &mut b,
        true,
        &install,
        "old-generation",
        json!({"tick":5}),
        &mut executions,
    )
    .await;
    single_active_stale(&stale);
    assignment_send(&mut a, json!({"type":"unregistertrigger", "id":"tick"})).await;
    let stop = assignment_frame(&mut a, "unregistertrigger").await;
    assert_eq!(stop["assignment_id"], install["assignment_id"]);
    assert!(
        !engine
            .trigger_registry
            .triggers
            .contains_key(install["id"].as_str().unwrap()),
        "revocation precedes stop acknowledgement"
    );
    let removed = single_active_fire(
        &mut a,
        &mut b,
        true,
        &install,
        &token,
        json!({"tick":6}),
        &mut executions,
    )
    .await;
    single_active_stale(&removed);
    assert_eq!(
        executions.len(),
        4,
        "stale/removal rejection cannot replay accepted ticks"
    );
    assignment_send(
        &mut a,
        json!({"type":"unregistertriggerresult", "id":stop["id"],
        "trigger_type":kind, "assignment_id":stop["assignment_id"]}),
    )
    .await;
    assignment_barrier(&mut a).await;
    single_active_no_assignment(assignment_barrier(&mut b).await);
    let _ = a.close(None).await;
    let _ = b.close(None).await;
}

#[tokio::test]
async fn shared_trigger_single_active_two_ws_cyclic_initial_selection_and_sticky_retry() {
    let kind = "fixture:cyclic";
    let (_engine, mut a, mut b, _directory) = single_active_providers(kind).await;
    for (event, on_a) in [(1, true), (2, false), (3, true)] {
        let alias = format!("binding-{event}");
        single_active_subscribe(&mut a, &alias, kind, event).await;
        let (selected_a, install) = tokio::select! {
            install = assignment_frame(&mut a, "registertrigger") => (true, install),
            install = assignment_frame(&mut b, "registertrigger") => (false, install),
        };
        assert_eq!(
            selected_a, on_a,
            "initial selection must cycle A, B, A in registration order; a distinct binding cannot always select A"
        );
        single_active_no_assignment(assignment_barrier(if on_a { &mut b } else { &mut a }).await);
        single_active_ack(if on_a { &mut a } else { &mut b }, &install).await;
        single_active_registered(&mut a, &alias).await;
        // Same logical descriptor, second subscriber: no new assignment.
        let peer_alias = format!("peer-{event}");
        single_active_subscribe(&mut b, &peer_alias, kind, event).await;
        single_active_registered(&mut b, &peer_alias).await;
        single_active_no_assignment(assignment_barrier(&mut a).await);
        single_active_no_assignment(assignment_barrier(&mut b).await);
    }
    let _ = a.close(None).await;
    let _ = b.close(None).await;
}

#[tokio::test]
async fn shared_trigger_single_active_two_ws_queue_engine_fence_is_not_broker_lease() {
    let kind = "fixture:queue";
    let (_engine, mut a, mut b, _directory) = single_active_providers(kind).await;
    single_active_subscribe(&mut b, "queue-consumer", kind, 1).await;
    let install = assignment_frame(&mut a, "registertrigger").await;
    let token = assignment_token(&install).to_owned();
    single_active_ack(&mut a, &install).await;
    single_active_registered(&mut b, "queue-consumer").await;
    single_active_no_assignment(assignment_barrier(&mut b).await);
    let mut executions = Vec::new();
    // Broker reservation belongs to the adapter/broker, outside engine fencing.
    // Deliberately retain it after rejection: engine must not release/ACK it.
    let broker_reservations = std::collections::HashSet::from(["message-1"]);
    let rejected = single_active_fire(
        &mut a,
        &mut b,
        false,
        &install,
        &token,
        json!({"message":"message-1"}),
        &mut executions,
    )
    .await;
    single_active_stale(&rejected);
    assert!(executions.is_empty());
    assert!(
        broker_reservations.contains("message-1"),
        "fire rejection is not broker ACK/lease management"
    );
    let accepted = single_active_fire(
        &mut a,
        &mut b,
        true,
        &install,
        &token,
        json!({"message":"message-1"}),
        &mut executions,
    )
    .await;
    assert!(
        accepted["error"].is_null(),
        "active queue consumer can fire: {accepted}"
    );
    assert_eq!(executions.len(), 1);
    // No exactly-once promise: another explicit delivery is another invocation.
    let redelivery = single_active_fire(
        &mut a,
        &mut b,
        true,
        &install,
        &token,
        json!({"message":"message-1"}),
        &mut executions,
    )
    .await;
    assert!(redelivery["error"].is_null());
    assert_eq!(
        executions.len(),
        2,
        "engine must not pretend to deduplicate broker redelivery"
    );
    let _ = a.close(None).await;
    let _ = b.close(None).await;
}

#[tokio::test]
async fn shared_trigger_single_active_two_ws_disconnect_revokes_then_reassigns_without_replay() {
    let kind = "fixture:handover";
    let (engine, mut a, mut b, _directory) = single_active_providers(kind).await;
    single_active_subscribe(&mut b, "surviving-consumer", kind, 1).await;
    let old = assignment_frame(&mut a, "registertrigger").await;
    let old_token = assignment_token(&old).to_owned();
    single_active_ack(&mut a, &old).await;
    single_active_registered(&mut b, "surviving-consumer").await;
    let mut executions = Vec::new();
    let accepted = single_active_fire(
        &mut a,
        &mut b,
        true,
        &old,
        &old_token,
        json!({"tick":1}),
        &mut executions,
    )
    .await;
    assert!(
        accepted["error"].is_null(),
        "positively acknowledged owner requires the new engine::triggers::fire gateway: {accepted}"
    );
    assert_eq!(executions.len(), 1);
    single_active_no_assignment(assignment_barrier(&mut b).await);
    a.close(None).await.unwrap();
    assert!(
        eventually(|| engine
            .worker_registry
            .list_workers()
            .iter()
            .all(|worker| worker.name.as_deref() != Some("parallel-provider-a")))
        .await,
        "handover starts only after engine observes owner disconnection"
    );
    let replacement = assignment_frame(&mut b, "registertrigger").await;
    assert_eq!(
        replacement["id"], old["id"],
        "handover preserves logical binding"
    );
    let token = assignment_token(&replacement).to_owned();
    assert_ne!(
        token, old_token,
        "revoked owner generation cannot be reused"
    );
    single_active_ack(&mut b, &replacement).await;
    let frames = assignment_barrier(&mut b).await;
    assert!(
        !frames.iter().any(|frame| frame["type"] == "invokefunction"),
        "accepted work is never replayed by reassignment: {frames:?}"
    );
    for (generation, tick, allowed) in [(&old_token, 2, false), (&token, 3, true)] {
        let invocation = uuid::Uuid::new_v4().to_string();
        assignment_send(
            &mut b,
            json!({"type":"invokefunction", "invocation_id":invocation,
            "function_id":"engine::triggers::fire", "data":{"id":replacement["id"],
                "assignment_id":generation, "data":{"tick":tick}}}),
        )
        .await;
        let result = tokio::time::timeout(Duration::from_secs(3), async {
            loop {
                let frame = b.next().await.unwrap().unwrap();
                let WsMessage::Text(text) = frame else {
                    continue;
                };
                let value: Value = serde_json::from_str(&text).unwrap();
                if value["type"] == "invocationresult" && value["invocation_id"] == invocation {
                    break value;
                }
                assert_eq!(value["type"], "invokefunction");
                assert!(allowed, "revoked token cannot reach a target");
                assert_eq!(value["function_id"], "orders::route");
                assert_eq!(value["data"]["tick"], tick);
                executions.push((false, value["data"].clone()));
                assignment_send(
                    &mut b,
                    json!({"type":"invocationresult", "invocation_id":value["invocation_id"],
                    "function_id":value["function_id"], "result":{"accepted":true}}),
                )
                .await;
            }
        })
        .await
        .expect("replacement tick result barrier");
        if allowed {
            assert!(
                result["error"].is_null(),
                "positively acknowledged replacement can fire: {result}"
            );
        } else {
            single_active_stale(&result);
        }
    }
    assert_eq!(
        executions.len(),
        2,
        "one old accepted tick and one new tick, no handover replay"
    );
    let _ = b.close(None).await;
}

#[tokio::test]
async fn shared_trigger_single_active_two_ws_live_legacy_fallback_cannot_replay_into_shared_v1() {
    single_active_legacy_replay_ws(false).await;
}

#[tokio::test]
async fn shared_trigger_single_active_two_ws_ambiguous_legacy_loss_cannot_replay_into_shared_v1() {
    single_active_legacy_replay_ws(true).await;
}

async fn single_active_legacy_replay_ws(disconnected: bool) {
    use iii::trigger::{RegisterTriggerOutcome, Trigger, TriggerDeliveryContract, TriggerType};
    let kind = "fixture:legacy-upgrade";
    let (engine, mut legacy_socket, mut home_socket, _directory) = assignment_providers().await;
    let legacy_worker = engine
        .worker_registry
        .list_workers()
        .into_iter()
        .find(|worker| worker.name.as_deref() == Some("parallel-provider-a"))
        .unwrap();
    // The registry placement models a legacy default provider while preserving
    // the two real WS transports. All install/stop messages go to those sockets.
    engine
        .trigger_registry
        .register_trigger_type(TriggerType::new_ns(
            if disconnected {
                "orders"
            } else {
                DEFAULT_NAMESPACE
            },
            kind,
            "legacy socket fixture",
            Box::new(legacy_worker.clone()),
            Some(legacy_worker.id),
        ))
        .await
        .unwrap();
    single_active_subscribe(&mut home_socket, "legacy-intent", kind, 1).await;
    let old_install = assignment_frame(&mut legacy_socket, "registertrigger").await;
    assert!(
        old_install["assignment_id"].is_null(),
        "precondition: unfenced legacy installation"
    );
    let canonical = old_install["id"].as_str().unwrap().to_owned();
    let mut local_legacy_routes = std::collections::HashSet::from([canonical.clone()]);
    // The legacy adapter positively reports installation, never reports stop.
    assignment_send(
        &mut legacy_socket,
        json!({"type":"triggerregistrationresult",
        "id":old_install["id"], "trigger_type":kind, "function_id":old_install["function_id"]}),
    )
    .await;
    single_active_registered(&mut home_socket, "legacy-intent").await;
    if disconnected {
        legacy_socket.close(None).await.unwrap();
        assert!(
            eventually(|| engine
                .worker_registry
                .get_worker(&legacy_worker.id)
                .is_none())
            .await,
            "observe disconnect before a replacement declaration; socket loss is not proof of legacy stop"
        );
    }

    // A strict-home pending intent cannot use the legacy fallback. Its install
    // is a positive replay-progress barrier, avoiding quiet-time assertions.
    let sentinel = Trigger {
        id: "replay-sentinel".into(),
        trigger_type: kind.into(),
        function_id: "orders::route".into(),
        config: json!({"event":"sentinel"}),
        worker_id: None,
        metadata: None,
        namespace: "orders".into(),
        trigger_namespace: Some("orders".into()),
        home_namespace: "orders".into(),
        provider_namespace: "orders".into(),
    };
    assert_eq!(
        engine
            .trigger_registry
            .register_trigger(sentinel.clone())
            .await
            .unwrap(),
        RegisterTriggerOutcome::Deferred
    );
    let home_worker = engine
        .worker_registry
        .list_workers()
        .into_iter()
        .find(|worker| worker.name.as_deref() == Some("parallel-provider-b"))
        .unwrap();
    // Declare without installing through the public registry API, then drive
    // the actual WS replay by re-announcing the same compatible declaration.
    engine
        .trigger_registry
        .register_trigger_type(
            TriggerType::new_ns(
                "orders",
                kind,
                "single-active tick fixture",
                Box::new(home_worker.clone()),
                Some(home_worker.id),
            )
            .with_delivery_contract(TriggerDeliveryContract::SharedV1),
        )
        .await
        .unwrap();
    assert!(
        engine
            .trigger_registry
            .pending_triggers
            .contains_key(&canonical),
        "uncertain legacy intent must initially park"
    );
    assignment_send(&mut home_socket, single_active_declaration(kind)).await;
    let mut installations = Vec::new();
    loop {
        let frame = assignment_frame(&mut home_socket, "registertrigger").await;
        let is_sentinel = frame["id"] == sentinel.id;
        installations.push(frame);
        if is_sentinel {
            break;
        }
    }
    // join_all has polled every replay install before the sentinel can arrive;
    // Pong preserves any other installations enqueued by that replay snapshot.
    installations.extend(
        assignment_barrier(&mut home_socket)
            .await
            .into_iter()
            .filter(|frame| frame["type"] == "registertrigger"),
    );
    if !disconnected {
        let legacy_frames = assignment_barrier(&mut legacy_socket).await;
        for frame in &legacy_frames {
            if frame["type"] == "unregistertrigger" {
                // Receiving stop is NOT a positive stop ACK: keep local work.
                assert!(local_legacy_routes.contains(&canonical));
            }
        }
    }
    assert!(
        local_legacy_routes.contains(&canonical),
        "legacy execution remains possible without positive stop acknowledgement"
    );
    assert!(
        !installations.iter().any(|frame| frame["id"] == canonical),
        "unsafe shared_v1 install bypassed uncertain legacy work via replay; disconnected={disconnected}; installations={installations:?}"
    );
    assert!(!engine.trigger_registry.triggers.contains_key(&canonical));
    assert!(
        engine
            .trigger_registry
            .pending_triggers
            .contains_key(&canonical)
    );
    let sentinel_install = installations
        .iter()
        .find(|frame| frame["id"] == sentinel.id)
        .unwrap();
    single_active_ack(&mut home_socket, sentinel_install).await;
    assignment_barrier(&mut home_socket).await;
    local_legacy_routes.clear(); // fixture teardown only, not an engine/broker ACK
    let _ = legacy_socket.close(None).await;
    let _ = home_socket.close(None).await;
}

#[tokio::test]
async fn shared_trigger_single_active_two_ws_inflight_ownerless_legacy_cleanup_cannot_install_replacement()
 {
    use iii::trigger::{RegisterTriggerOutcome, Trigger, TriggerType, type_key};
    let kind = "fixture:inflight-ownerless";
    let (engine, mut legacy_socket, mut replacement_socket, _directory) =
        assignment_providers().await;
    let legacy = engine
        .worker_registry
        .list_workers()
        .into_iter()
        .find(|worker| worker.name.as_deref() == Some("parallel-provider-a"))
        .unwrap();
    let key = type_key("orders", kind);
    engine
        .trigger_registry
        .register_trigger_type(TriggerType::new_ns(
            "orders",
            kind,
            "legacy inflight fixture",
            Box::new(legacy.clone()),
            Some(legacy.id),
        ))
        .await
        .unwrap();
    let binding = Trigger {
        id: "ownerless-late-install".into(),
        trigger_type: kind.into(),
        function_id: "orders::route".into(),
        config: json!({"tick":1}),
        worker_id: None,
        metadata: None,
        namespace: "orders".into(),
        trigger_namespace: Some("orders".into()),
        home_namespace: "orders".into(),
        provider_namespace: "orders".into(),
    };
    let registration = engine.trigger_registry.register_trigger(binding.clone());
    tokio::pin!(registration);
    assert!(
        futures::poll!(&mut registration).is_pending(),
        "ownerless registration awaits actual provider ACK"
    );
    let installed = assignment_frame(&mut legacy_socket, "registertrigger").await;
    assert_eq!(installed["id"], binding.id);
    assert!(
        installed["assignment_id"].is_null(),
        "legacy has no fencing token"
    );
    // Installed locally, ACK withheld. Do not poll registration again until
    // actual socket cleanup removed both the worker and provider declaration.
    let local_legacy_routes = std::collections::HashSet::from([binding.id.clone()]);
    legacy_socket.close(None).await.unwrap();
    assert!(
        eventually(|| engine.worker_registry.get_worker(&legacy.id).is_none()
            && !engine.trigger_registry.trigger_types.contains_key(&key))
        .await,
        "cleanup must pass the legacy uncertainty scan before registration resumes"
    );
    let completion = registration.await;
    let late_publication = engine.trigger_registry.triggers.contains_key(&binding.id);

    // Strict-home sentinel proves that the replacement replay ran without
    // relying on a quiet interval to claim absence of the unsafe installation.
    let sentinel = Trigger {
        id: "inflight-replay-sentinel".into(),
        ..binding.clone()
    };
    assert_eq!(
        engine
            .trigger_registry
            .register_trigger(sentinel.clone())
            .await
            .unwrap(),
        RegisterTriggerOutcome::Deferred
    );
    assignment_send(&mut replacement_socket, single_active_declaration(kind)).await;
    let mut installations = Vec::new();
    loop {
        let frame = assignment_frame(&mut replacement_socket, "registertrigger").await;
        let sentinel_seen = frame["id"] == sentinel.id;
        installations.push(frame);
        if sentinel_seen {
            break;
        }
    }
    installations.extend(
        assignment_barrier(&mut replacement_socket)
            .await
            .into_iter()
            .filter(|frame| frame["type"] == "registertrigger"),
    );
    assert!(
        local_legacy_routes.contains(&binding.id),
        "socket loss does not prove adapter stop"
    );
    assert!(
        !late_publication && !installations.iter().any(|frame| frame["id"] == binding.id),
        "ownerless legacy I/O completed after cleanup without uncertainty: late_publication={late_publication}, completion={completion:?}, installations={installations:?}; no stop ACK was supplied"
    );
    assert!(!engine.trigger_registry.triggers.contains_key(&binding.id));
    assert!(
        engine
            .trigger_registry
            .pending_triggers
            .contains_key(&binding.id)
    );
    let sentinel_frame = installations
        .iter()
        .find(|frame| frame["id"] == sentinel.id)
        .unwrap();
    single_active_ack(&mut replacement_socket, sentinel_frame).await;
    assignment_barrier(&mut replacement_socket).await;
    let _ = replacement_socket.close(None).await;
}
