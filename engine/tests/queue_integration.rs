use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};
use std::time::Duration;

use serde_json::{json, Value};
use tokio::sync::Mutex;

use iii::{
    engine::Engine,
    function::{Function, FunctionResult},
    modules::{
        module::Module,
        queue::QueueCoreModule,
    },
};

/// JSON configuration for the QueueCoreModule that defines two named queues:
///   - "default": a standard (concurrent) queue
///   - "payment": a FIFO queue keyed on "transaction_id"
fn queue_config_json() -> Value {
    json!({
        "queue_configs": {
            "default": {
                "type": "standard",
                "concurrency": 3,
                "max_retries": 2,
                "backoff_ms": 100,
                "poll_interval_ms": 50
            },
            "payment": {
                "type": "fifo",
                "message_group_field": "transaction_id",
                "concurrency": 1,
                "max_retries": 2,
                "backoff_ms": 100,
                "poll_interval_ms": 50
            }
        }
    })
}

/// Creates an Engine, builds and initializes a QueueCoreModule (which starts
/// consumer loops and registers the module on the engine), then returns the
/// engine so callers can interact with the queue through
/// `engine.queue_module`.
async fn create_initialized_engine() -> Arc<Engine> {
    iii::modules::observability::metrics::ensure_default_meter();

    let engine = Arc::new(Engine::new());

    let module = QueueCoreModule::create(engine.clone(), Some(queue_config_json()))
        .await
        .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    engine
}

/// Convenience helper to call `enqueue_to_function_queue` through the
/// engine's queue_module field.
async fn enqueue(
    engine: &Engine,
    queue_name: &str,
    function_id: &str,
    data: Value,
) -> anyhow::Result<()> {
    let guard = engine.queue_module.read().await;
    let qm = guard
        .as_ref()
        .expect("queue_module should be set after initialize");
    qm.enqueue_to_function_queue(queue_name, function_id, data, None, None)
        .await
}

/// Registers a test function whose handler increments a shared counter on
/// every invocation.
fn register_counting_function(engine: &Arc<Engine>, function_id: &str, counter: Arc<AtomicU64>) {
    let function = Function {
        handler: Arc::new(move |_invocation_id, _input| {
            let count = counter.clone();
            Box::pin(async move {
                count.fetch_add(1, Ordering::SeqCst);
                FunctionResult::Success(Some(json!({ "ok": true })))
            })
        }),
        _function_id: function_id.to_string(),
        _description: Some("counting test handler".to_string()),
        request_format: None,
        response_format: None,
        metadata: None,
    };
    engine
        .functions
        .register_function(function_id.to_string(), function);
}

/// Registers a test function that records the value of a named field from
/// each invocation payload into a shared ordered list.
fn register_order_recording_function(
    engine: &Arc<Engine>,
    function_id: &str,
    field_name: &'static str,
    record: Arc<Mutex<Vec<Value>>>,
) {
    let function = Function {
        handler: Arc::new(move |_invocation_id, input| {
            let rec = record.clone();
            Box::pin(async move {
                let value = input.get(field_name).cloned().unwrap_or(Value::Null);
                rec.lock().await.push(value);
                FunctionResult::Success(Some(json!({ "ok": true })))
            })
        }),
        _function_id: function_id.to_string(),
        _description: Some("order recording test handler".to_string()),
        request_format: None,
        response_format: None,
        metadata: None,
    };
    engine
        .functions
        .register_function(function_id.to_string(), function);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[tokio::test]
async fn enqueue_to_standard_queue_succeeds() {
    let engine = create_initialized_engine().await;

    let result = enqueue(&engine, "default", "test::handler", json!({"key": "value"})).await;

    assert!(result.is_ok(), "Enqueue to 'default' should succeed");
}

#[tokio::test]
async fn enqueue_to_unknown_queue_fails() {
    let engine = create_initialized_engine().await;

    let result = enqueue(
        &engine,
        "nonexistent",
        "test::handler",
        json!({"key": "value"}),
    )
    .await;

    assert!(result.is_err(), "Enqueue to unknown queue should fail");
    let err = result.unwrap_err().to_string();
    assert!(
        err.contains("not found"),
        "Error should mention 'not found', got: {err}"
    );
}

#[tokio::test]
async fn enqueue_to_fifo_missing_group_field_fails() {
    let engine = create_initialized_engine().await;

    // The "payment" queue is FIFO with message_group_field = "transaction_id".
    // Sending a payload without that field should be rejected.
    let result = enqueue(&engine, "payment", "test::handler", json!({"amount": 100})).await;

    assert!(
        result.is_err(),
        "Enqueue to FIFO queue without group field should fail"
    );
    let err = result.unwrap_err().to_string();
    assert!(
        err.contains("transaction_id"),
        "Error should reference the missing field, got: {err}"
    );
}

#[tokio::test]
async fn enqueue_to_fifo_null_group_field_fails() {
    let engine = create_initialized_engine().await;

    let result = enqueue(
        &engine,
        "payment",
        "test::handler",
        json!({"transaction_id": null, "amount": 100}),
    )
    .await;

    assert!(
        result.is_err(),
        "Enqueue to FIFO queue with null group field should fail"
    );
    let err = result.unwrap_err().to_string();
    assert!(
        err.contains("null"),
        "Error should mention null, got: {err}"
    );
}

#[tokio::test]
async fn full_roundtrip_enqueue_consume_invoke() {
    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let call_count = Arc::new(AtomicU64::new(0));
    register_counting_function(&engine, "test::handler", call_count.clone());

    let module = QueueCoreModule::create(engine.clone(), Some(queue_config_json()))
        .await
        .expect("QueueCoreModule::create should succeed");

    // Initialize starts the consumer loops in the background.
    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    // Enqueue a single message to the standard queue.
    enqueue(
        &engine,
        "default",
        "test::handler",
        json!({"task": "process_order", "order_id": 42}),
    )
    .await
    .expect("Enqueue should succeed");

    // Allow the consumer loop time to poll, dequeue, and invoke the function.
    tokio::time::sleep(Duration::from_millis(500)).await;

    assert_eq!(
        call_count.load(Ordering::SeqCst),
        1,
        "The registered function should have been invoked exactly once"
    );
}

#[tokio::test]
async fn full_roundtrip_fifo_preserves_order() {
    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let invocation_order: Arc<Mutex<Vec<Value>>> = Arc::new(Mutex::new(Vec::new()));
    register_order_recording_function(
        &engine,
        "test::fifo_handler",
        "seq",
        invocation_order.clone(),
    );

    let module = QueueCoreModule::create(engine.clone(), Some(queue_config_json()))
        .await
        .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    // Enqueue 5 messages to the FIFO queue with the same transaction_id
    // (same message group) so they are processed sequentially.
    let message_count: usize = 5;
    for i in 0..message_count {
        enqueue(
            &engine,
            "payment",
            "test::fifo_handler",
            json!({
                "transaction_id": "txn-abc",
                "seq": i,
            }),
        )
        .await
        .expect("Enqueue should succeed");
    }

    // Wait for all messages to be consumed and processed.
    tokio::time::sleep(Duration::from_millis(1500)).await;

    let recorded = invocation_order.lock().await;
    assert_eq!(
        recorded.len(),
        message_count,
        "All {message_count} messages should have been processed, but got {}",
        recorded.len()
    );

    // Verify FIFO ordering: seq values should arrive in 0, 1, 2, 3, 4 order.
    let expected: Vec<Value> = (0..message_count as i64).map(|i| json!(i)).collect();
    assert_eq!(
        *recorded, expected,
        "FIFO queue should preserve insertion order"
    );
}
