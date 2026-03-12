//! Integration tests for the queue system via SDK.
//!
//! Requires a running III engine with queue module configured:
//! ```yaml
//! modules:
//!   - class: modules::queue::QueueModule
//!     config:
//!       queue_configs:
//!         default:
//!           max_retries: 3
//!           concurrency: 5
//!           type: standard
//!         payment:
//!           max_retries: 5
//!           concurrency: 2
//!           type: fifo
//!           message_group_field: transaction_id
//! ```
//!
//! Set III_URL or use ws://localhost:49134 default.

use std::sync::Arc;
use std::time::Duration;

use serde_json::{Value, json};
use tokio::sync::Mutex;

use iii_sdk::{III, IIIError, TriggerAction, TriggerRequest};

fn engine_ws_url() -> String {
    std::env::var("III_URL").unwrap_or_else(|_| "ws://localhost:49134".to_string())
}

/// Helper to wait for function registration propagation.
async fn settle() {
    tokio::time::sleep(Duration::from_millis(300)).await;
}

#[tokio::test]
async fn enqueue_returns_acknowledgement() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let received = Arc::new(Mutex::new(Vec::new()));
    let received_clone = received.clone();
    iii.register_function("test.queue.echo.rs", move |input: Value| {
        let received = received_clone.clone();
        async move {
            received.lock().await.push(input.clone());
            Ok(json!({ "processed": true }))
        }
    });
    settle().await;

    let result = iii
        .trigger(
            TriggerRequest::new("test.queue.echo.rs", json!({"msg": "hello"}))
                .action(TriggerAction::enqueue("default")),
        )
        .await
        .expect("enqueue should succeed");

    assert!(
        result["messageReceiptId"].is_string(),
        "enqueue should return a messageReceiptId"
    );

    // Wait for consumer to process
    tokio::time::sleep(Duration::from_secs(2)).await;

    let msgs = received.lock().await;
    assert_eq!(msgs.len(), 1);
    assert_eq!(msgs[0]["msg"], "hello");

    iii.shutdown_async().await;
}

#[tokio::test]
async fn enqueue_to_unknown_queue_returns_error() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let result = iii
        .trigger(
            TriggerRequest::new("test.queue.unknown.rs", json!({"msg": "hello"}))
                .action(TriggerAction::enqueue("nonexistent_queue")),
        )
        .await;

    match result {
        Err(IIIError::Remote { code, message, .. }) => {
            assert_eq!(
                code, "enqueue_error",
                "expected enqueue_error code, got: {code}"
            );
            assert!(!message.is_empty(), "error message should not be empty");
        }
        Err(other) => panic!("expected IIIError::Remote with enqueue_error code, got: {other:?}"),
        Ok(val) => panic!("expected error, got success: {val}"),
    }

    iii.shutdown_async().await;
}

#[tokio::test]
async fn enqueue_fifo_with_valid_group_field() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let received = Arc::new(Mutex::new(Vec::new()));
    let received_clone = received.clone();
    iii.register_function("test.queue.fifo.rs", move |input: Value| {
        let received = received_clone.clone();
        async move {
            received.lock().await.push(input.clone());
            Ok(json!({ "processed": true }))
        }
    });
    settle().await;

    let result = iii
        .trigger(
            TriggerRequest::new(
                "test.queue.fifo.rs",
                json!({
                    "transaction_id": "txn-001",
                    "amount": 99.99
                }),
            )
            .action(TriggerAction::enqueue("payment")),
        )
        .await
        .expect("enqueue to fifo should succeed");

    assert!(
        result["messageReceiptId"].is_string(),
        "enqueue should return a messageReceiptId"
    );

    // Wait for consumer to process
    tokio::time::sleep(Duration::from_secs(2)).await;

    let msgs = received.lock().await;
    assert_eq!(msgs.len(), 1);
    assert_eq!(msgs[0]["transaction_id"], "txn-001");
    assert_eq!(msgs[0]["amount"], 99.99);

    iii.shutdown_async().await;
}

#[tokio::test]
async fn enqueue_fifo_missing_group_field_returns_error() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let result = iii
        .trigger(
            TriggerRequest::new(
                "test.queue.fifo.nofield.rs",
                json!({
                    "amount": 50.00
                }),
            )
            .action(TriggerAction::enqueue("payment")),
        )
        .await;

    match result {
        Err(IIIError::Remote { code, message, .. }) => {
            assert_eq!(
                code, "enqueue_error",
                "expected enqueue_error code, got: {code}"
            );
            assert!(
                message.contains("transaction_id"),
                "error message should mention the missing field 'transaction_id', got: {message}"
            );
        }
        Err(other) => panic!("expected IIIError::Remote with enqueue_error code, got: {other:?}"),
        Ok(val) => panic!("expected error for missing group field, got success: {val}"),
    }

    iii.shutdown_async().await;
}

#[tokio::test]
async fn void_returns_null_immediately() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let call_count = Arc::new(Mutex::new(0u32));
    let count_clone = call_count.clone();
    iii.register_function("test.queue.void.rs", move |_input: Value| {
        let count = count_clone.clone();
        async move {
            *count.lock().await += 1;
            Ok(json!({ "done": true }))
        }
    });
    settle().await;

    let result = iii
        .trigger(
            TriggerRequest::new("test.queue.void.rs", json!({"fire": "forget"}))
                .action(TriggerAction::void()),
        )
        .await
        .expect("void should succeed");

    assert_eq!(result, Value::Null, "void should return null immediately");

    // Wait for the function to be invoked by the engine
    tokio::time::sleep(Duration::from_secs(2)).await;

    let count = *call_count.lock().await;
    assert_eq!(count, 1, "function should have been called exactly once");

    iii.shutdown_async().await;
}

#[tokio::test]
async fn enqueue_multiple_messages_all_processed() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let received = Arc::new(Mutex::new(Vec::new()));
    let received_clone = received.clone();
    iii.register_function("test.queue.multi.rs", move |input: Value| {
        let received = received_clone.clone();
        async move {
            received.lock().await.push(input.clone());
            Ok(json!({ "processed": true }))
        }
    });
    settle().await;

    let message_count = 5;
    for i in 0..message_count {
        let result = iii
            .trigger(
                TriggerRequest::new("test.queue.multi.rs", json!({ "index": i }))
                    .action(TriggerAction::enqueue("default")),
            )
            .await
            .unwrap_or_else(|_| panic!("enqueue message {i} should succeed"));

        assert!(
            result["messageReceiptId"].is_string(),
            "enqueue should return a messageReceiptId"
        );
    }

    // Wait for consumer to process all messages
    tokio::time::sleep(Duration::from_secs(3)).await;

    let msgs = received.lock().await;
    assert_eq!(
        msgs.len(),
        message_count,
        "all {message_count} messages should be processed, got {}",
        msgs.len()
    );

    // Verify all indices were received (order may vary for standard queue)
    let mut indices: Vec<i64> = msgs.iter().filter_map(|m| m["index"].as_i64()).collect();
    indices.sort();
    let expected: Vec<i64> = (0..message_count as i64).collect();
    assert_eq!(indices, expected, "all message indices should be present");

    iii.shutdown_async().await;
}

#[tokio::test]
async fn chained_enqueue() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    // Track what function B receives
    let b_received = Arc::new(Mutex::new(Vec::new()));
    let b_received_clone = b_received.clone();
    iii.register_function("test.queue.chain.b.rs", move |input: Value| {
        let b_received = b_received_clone.clone();
        async move {
            b_received.lock().await.push(input.clone());
            Ok(json!({ "step": "b_done" }))
        }
    });

    // Track what function A receives, and have it enqueue to B
    let a_received = Arc::new(Mutex::new(Vec::new()));
    let a_received_clone = a_received.clone();
    let iii_for_a = iii.clone();
    iii.register_function("test.queue.chain.a.rs", move |input: Value| {
        let a_received = a_received_clone.clone();
        let iii = iii_for_a.clone();
        async move {
            a_received.lock().await.push(input.clone());

            // Chain: function A enqueues work to function B
            let label = input["label"].as_str().unwrap_or("unknown").to_string();
            iii.trigger(
                TriggerRequest::new(
                    "test.queue.chain.b.rs",
                    json!({ "from_a": true, "label": label }),
                )
                .action(TriggerAction::enqueue("default")),
            )
            .await
            .map_err(|e| IIIError::Handler(e.to_string()))?;

            Ok(json!({ "step": "a_done" }))
        }
    });
    settle().await;

    // Enqueue to function A
    let result = iii
        .trigger(
            TriggerRequest::new("test.queue.chain.a.rs", json!({ "label": "chained-work" }))
                .action(TriggerAction::enqueue("default")),
        )
        .await
        .expect("enqueue to chain A should succeed");

    assert!(
        result["messageReceiptId"].is_string(),
        "enqueue should return a messageReceiptId"
    );

    // Wait for both A and B to process (A processes, then enqueues to B, then B processes)
    tokio::time::sleep(Duration::from_secs(4)).await;

    let a_msgs = a_received.lock().await;
    assert_eq!(a_msgs.len(), 1, "function A should have been called once");
    assert_eq!(a_msgs[0]["label"], "chained-work");

    let b_msgs = b_received.lock().await;
    assert_eq!(b_msgs.len(), 1, "function B should have been called once");
    assert_eq!(b_msgs[0]["from_a"], true);
    assert_eq!(b_msgs[0]["label"], "chained-work");

    iii.shutdown_async().await;
}
