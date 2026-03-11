use serde_json::{Value, json};
use std::sync::Arc;

use iii::{
    engine::{Engine, EngineTrait, Handler},
    function::FunctionResult,
    protocol::ErrorBody,
};

/// Creates a test handler that wraps a simple transform function, hiding the
/// verbose `Pin<Box<dyn Future ...>>` type coercion that would otherwise be
/// repeated in every test.
type HandlerFuture = std::pin::Pin<
    Box<dyn std::future::Future<Output = FunctionResult<Option<Value>, ErrorBody>> + Send>,
>;

fn make_test_handler(
    f: impl Fn(Value) -> Option<Value> + Send + Sync + 'static,
) -> Handler<impl Fn(Value) -> HandlerFuture> {
    Handler::new(move |input: Value| {
        let result = f(input);
        Box::pin(async move { FunctionResult::Success(result) })
            as std::pin::Pin<
                Box<
                    dyn std::future::Future<Output = FunctionResult<Option<Value>, ErrorBody>>
                        + Send,
                >,
            >
    })
}

#[tokio::test]
async fn test_basic_function_invocation() {
    let engine = Arc::new(Engine::new());

    let handler = make_test_handler(|input| {
        Some(json!({
            "input": input,
            "output": "processed"
        }))
    });

    engine.register_function_handler(
        iii::engine::RegisterFunctionRequest {
            function_id: "test.function".to_string(),
            description: Some("Test function".to_string()),
            request_format: None,
            response_format: None,
            metadata: None,
        },
        handler,
    );

    let function = engine.functions.get("test.function").unwrap();
    assert_eq!(function._function_id, "test.function");
}

#[tokio::test]
async fn test_engine_function_registration() {
    let engine = Engine::new();

    let handler = make_test_handler(|input| Some(json!({ "input": input })));

    engine.register_function_handler(
        iii::engine::RegisterFunctionRequest {
            function_id: "another.test".to_string(),
            description: Some("Another test function".to_string()),
            request_format: None,
            response_format: None,
            metadata: None,
        },
        handler,
    );

    assert!(engine.functions.get("another.test").is_some());
}

#[tokio::test]
async fn worker_pid_is_stored_and_listed() {
    use iii::{
        engine::Outbound,
        modules::{
            module::Module, observability::metrics::ensure_default_meter, worker::WorkerModule,
        },
        workers::Worker,
    };

    ensure_default_meter();
    let engine = Arc::new(Engine::new());

    let worker_module = WorkerModule::create(engine.clone(), None)
        .await
        .expect("create WorkerModule");
    worker_module
        .initialize()
        .await
        .expect("initialize WorkerModule");
    worker_module.register_functions(engine.clone());

    // Simulate worker connecting
    let (tx, _rx) = tokio::sync::mpsc::channel::<Outbound>(8);
    let worker = Worker::new(tx);
    let worker_id = worker.id.to_string();
    engine.worker_registry.register_worker(worker);

    // Register with pid
    engine
        .call(
            "engine::workers::register",
            serde_json::json!({
                "_caller_worker_id": worker_id,
                "runtime": "node",
                "version": "20.0.0",
                "pid": 42000u32,
            }),
        )
        .await
        .expect("register call should succeed");

    // List workers and verify pid is present
    let list_result = engine
        .call("engine::workers::list", serde_json::json!({}))
        .await
        .expect("list call succeeds")
        .expect("result is Some");

    let workers = list_result
        .get("workers")
        .and_then(|v| v.as_array())
        .expect("workers array");

    let found = workers
        .iter()
        .find(|w| w.get("id").and_then(|v| v.as_str()) == Some(worker_id.as_str()))
        .expect("worker in list");

    assert_eq!(found.get("pid").and_then(|v| v.as_u64()), Some(42000u64));
}
