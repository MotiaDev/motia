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
