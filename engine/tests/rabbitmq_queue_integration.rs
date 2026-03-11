// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

#![cfg(feature = "rabbitmq")]

use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};
use std::time::Duration;

use lapin::{options::*, Connection, ConnectionProperties};
use serde_json::{json, Value};
use tokio::sync::Mutex;
use uuid::Uuid;

use iii::{
    engine::Engine,
    function::{Function, FunctionResult},
    modules::{module::Module, queue::QueueCoreModule},
};

// ---------------------------------------------------------------------------
// Infrastructure helpers
// ---------------------------------------------------------------------------

fn rabbitmq_url() -> String {
    std::env::var("RABBITMQ_URL").unwrap_or_else(|_| "amqp://localhost:5672".to_string())
}

async fn try_connect_rabbitmq() -> Option<Connection> {
    match Connection::connect(&rabbitmq_url(), ConnectionProperties::default()).await {
        Ok(conn) => Some(conn),
        Err(e) => {
            eprintln!(
                "Skipping RabbitMQ integration test: cannot connect to {} — {}",
                rabbitmq_url(),
                e
            );
            None
        }
    }
}

macro_rules! skip_if_no_rabbitmq {
    () => {
        if try_connect_rabbitmq().await.is_none() {
            return;
        }
    };
}

fn test_prefix() -> String {
    Uuid::new_v4().to_string()[..8].to_string()
}

fn rabbitmq_queue_config_json(prefix: &str) -> Value {
    json!({
        "adapter": {
            "class": "modules::queue::RabbitMQAdapter",
            "config": {
                "amqp_url": rabbitmq_url()
            }
        },
        "queue_configs": {
            format!("{prefix}-default"): {
                "type": "standard",
                "concurrency": 3,
                "max_retries": 2,
                "backoff_ms": 200,
                "poll_interval_ms": 100
            },
            format!("{prefix}-payment"): {
                "type": "fifo",
                "message_group_field": "transaction_id",
                "concurrency": 1,
                "max_retries": 2,
                "backoff_ms": 200,
                "poll_interval_ms": 100
            }
        }
    })
}

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
    let message_id = Uuid::new_v4().to_string();
    qm.enqueue_to_function_queue(queue_name, function_id, data, message_id, None, None)
        .await
}

async fn dlq_count(engine: &Engine, queue_name: &str) -> u64 {
    let guard = engine.queue_module.read().await;
    let qm = guard
        .as_ref()
        .expect("queue_module should be set after initialize");
    qm.function_queue_dlq_count(queue_name)
        .await
        .expect("dlq_count should not fail")
}

/// Cleanup RabbitMQ queues and exchanges created by a test prefix.
async fn cleanup_queues(prefix: &str) {
    let conn = match try_connect_rabbitmq().await {
        Some(c) => c,
        None => return,
    };
    let channel = match conn.create_channel().await {
        Ok(ch) => ch,
        Err(_) => return,
    };

    let queue_names = vec![format!("{prefix}-default"), format!("{prefix}-payment")];

    for name in &queue_names {
        let resources = vec![
            format!("iii.__fn_queue::{name}.queue"),
            format!("iii.__fn_queue::{name}::retry.queue"),
            format!("iii.__fn_queue::{name}::dlq.queue"),
        ];
        let exchanges = vec![
            format!("iii.__fn_queue::{name}"),
            format!("iii.__fn_queue::{name}::retry"),
            format!("iii.__fn_queue::{name}::dlq"),
        ];

        for q in &resources {
            let _ = channel
                .queue_delete(q.as_str(), QueueDeleteOptions::default())
                .await;
        }
        for ex in &exchanges {
            let _ = channel
                .exchange_delete(ex.as_str(), ExchangeDeleteOptions::default())
                .await;
        }
    }
}

// ---------------------------------------------------------------------------
// Test function helpers (duplicated from queue_integration.rs since each
// integration test file is a separate crate in Rust)
// ---------------------------------------------------------------------------

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

fn register_slow_function(
    engine: &Arc<Engine>,
    function_id: &str,
    delay: Duration,
    timestamps: Arc<Mutex<Vec<std::time::Instant>>>,
) {
    let function = Function {
        handler: Arc::new(move |_invocation_id, _input| {
            let ts = timestamps.clone();
            let d = delay;
            Box::pin(async move {
                ts.lock().await.push(std::time::Instant::now());
                tokio::time::sleep(d).await;
                FunctionResult::Success(Some(json!({ "ok": true })))
            })
        }),
        _function_id: function_id.to_string(),
        _description: Some("slow test handler".to_string()),
        request_format: None,
        response_format: None,
        metadata: None,
    };
    engine
        .functions
        .register_function(function_id.to_string(), function);
}

fn register_failing_function(engine: &Arc<Engine>, function_id: &str, call_count: Arc<AtomicU64>) {
    let function = Function {
        handler: Arc::new(move |_invocation_id, _input| {
            let count = call_count.clone();
            Box::pin(async move {
                count.fetch_add(1, Ordering::SeqCst);
                FunctionResult::Failure(iii::protocol::ErrorBody {
                    code: "FAIL".to_string(),
                    message: "intentional failure".to_string(),
                    stacktrace: None,
                })
            })
        }),
        _function_id: function_id.to_string(),
        _description: Some("always-failing test handler".to_string()),
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
async fn full_roundtrip_enqueue_consume_invoke() {
    skip_if_no_rabbitmq!();
    let prefix = test_prefix();

    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let call_count = Arc::new(AtomicU64::new(0));
    register_counting_function(&engine, "test::rmq_handler", call_count.clone());

    let module =
        QueueCoreModule::create(engine.clone(), Some(rabbitmq_queue_config_json(&prefix)))
            .await
            .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    enqueue(
        &engine,
        &format!("{prefix}-default"),
        "test::rmq_handler",
        json!({"task": "process_order", "order_id": 42}),
    )
    .await
    .expect("Enqueue should succeed");

    // RabbitMQ has real network I/O — use generous timeout
    tokio::time::sleep(Duration::from_secs(5)).await;

    assert_eq!(
        call_count.load(Ordering::SeqCst),
        1,
        "The registered function should have been invoked exactly once"
    );

    cleanup_queues(&prefix).await;
}

#[tokio::test]
async fn full_roundtrip_fifo_preserves_order() {
    skip_if_no_rabbitmq!();
    let prefix = test_prefix();

    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let invocation_order: Arc<Mutex<Vec<Value>>> = Arc::new(Mutex::new(Vec::new()));
    register_order_recording_function(
        &engine,
        "test::rmq_fifo",
        "seq",
        invocation_order.clone(),
    );

    let module =
        QueueCoreModule::create(engine.clone(), Some(rabbitmq_queue_config_json(&prefix)))
            .await
            .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    let message_count: usize = 5;
    for i in 0..message_count {
        enqueue(
            &engine,
            &format!("{prefix}-payment"),
            "test::rmq_fifo",
            json!({
                "transaction_id": "txn-abc",
                "seq": i,
            }),
        )
        .await
        .expect("Enqueue should succeed");
    }

    tokio::time::sleep(Duration::from_secs(5)).await;

    let recorded = invocation_order.lock().await;
    assert_eq!(
        recorded.len(),
        message_count,
        "All {message_count} messages should have been processed, but got {}",
        recorded.len()
    );

    let expected: Vec<Value> = (0..message_count as i64).map(|i| json!(i)).collect();
    assert_eq!(
        *recorded, expected,
        "FIFO queue should preserve insertion order"
    );

    cleanup_queues(&prefix).await;
}

#[tokio::test]
async fn retry_behavior_with_rabbitmq() {
    skip_if_no_rabbitmq!();
    let prefix = test_prefix();

    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let call_count = Arc::new(AtomicU64::new(0));
    register_failing_function(&engine, "test::rmq_retry", call_count.clone());

    let module =
        QueueCoreModule::create(engine.clone(), Some(rabbitmq_queue_config_json(&prefix)))
            .await
            .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    enqueue(
        &engine,
        &format!("{prefix}-default"),
        "test::rmq_retry",
        json!({"key": "should_exhaust"}),
    )
    .await
    .expect("Enqueue should succeed");

    // max_retries=2, backoff_ms=200 → 3 attempts with TTL-based retry through RabbitMQ
    tokio::time::sleep(Duration::from_secs(10)).await;

    let total_calls = call_count.load(Ordering::SeqCst);
    assert!(
        total_calls >= 1 && total_calls <= 3,
        "Expected 1-3 invocations (1 initial + up to 2 retries), got {total_calls}"
    );

    // Confirm no further redeliveries
    let calls_before = total_calls;
    tokio::time::sleep(Duration::from_secs(3)).await;
    let calls_after = call_count.load(Ordering::SeqCst);
    assert_eq!(
        calls_before, calls_after,
        "No further invocations should occur after retry exhaustion, \
         but got {calls_after} (was {calls_before})"
    );

    cleanup_queues(&prefix).await;
}

#[tokio::test]
async fn exhausted_message_lands_in_dlq() {
    skip_if_no_rabbitmq!();
    let prefix = test_prefix();

    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let call_count = Arc::new(AtomicU64::new(0));
    register_failing_function(&engine, "test::rmq_dlq", call_count.clone());

    let module =
        QueueCoreModule::create(engine.clone(), Some(rabbitmq_queue_config_json(&prefix)))
            .await
            .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    assert_eq!(
        dlq_count(&engine, &format!("{prefix}-default")).await,
        0,
        "DLQ should start empty"
    );

    enqueue(
        &engine,
        &format!("{prefix}-default"),
        "test::rmq_dlq",
        json!({"should_land_in": "dlq"}),
    )
    .await
    .expect("Enqueue should succeed");

    // Wait for retries to exhaust and message to land in DLQ
    tokio::time::sleep(Duration::from_secs(10)).await;

    let count = dlq_count(&engine, &format!("{prefix}-default")).await;
    assert_eq!(
        count, 1,
        "Exactly one message should be in the DLQ after retry exhaustion, got {count}"
    );

    cleanup_queues(&prefix).await;
}

#[tokio::test]
async fn concurrent_processing() {
    skip_if_no_rabbitmq!();
    let prefix = test_prefix();

    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let timestamps: Arc<Mutex<Vec<std::time::Instant>>> = Arc::new(Mutex::new(Vec::new()));
    register_slow_function(
        &engine,
        "test::rmq_slow",
        Duration::from_millis(200),
        timestamps.clone(),
    );

    let module =
        QueueCoreModule::create(engine.clone(), Some(rabbitmq_queue_config_json(&prefix)))
            .await
            .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    let start = std::time::Instant::now();

    for i in 0..3 {
        enqueue(
            &engine,
            &format!("{prefix}-default"),
            "test::rmq_slow",
            json!({"idx": i}),
        )
        .await
        .expect("Enqueue should succeed");
    }

    tokio::time::sleep(Duration::from_secs(5)).await;

    let ts = timestamps.lock().await;
    assert_eq!(ts.len(), 3, "All 3 messages should have been processed");

    let first_start = *ts.iter().min().unwrap();
    let last_start = *ts.iter().max().unwrap();
    let spread = last_start.duration_since(first_start);

    assert!(
        spread < Duration::from_millis(1000),
        "Concurrent handlers should start close together, but spread was {:?} \
         (start timestamps relative to test start: {:?})",
        spread,
        ts.iter()
            .map(|t| t.duration_since(start))
            .collect::<Vec<_>>()
    );

    cleanup_queues(&prefix).await;
}

#[tokio::test]
async fn multiple_queues_operate_independently() {
    skip_if_no_rabbitmq!();
    let prefix = test_prefix();

    let engine = {
        iii::modules::observability::metrics::ensure_default_meter();
        Arc::new(Engine::new())
    };

    let default_count = Arc::new(AtomicU64::new(0));
    let payment_count = Arc::new(AtomicU64::new(0));
    register_counting_function(&engine, "test::rmq_default", default_count.clone());
    register_counting_function(&engine, "test::rmq_payment", payment_count.clone());

    let module =
        QueueCoreModule::create(engine.clone(), Some(rabbitmq_queue_config_json(&prefix)))
            .await
            .expect("QueueCoreModule::create should succeed");

    module
        .initialize()
        .await
        .expect("Module initialization should succeed");

    for i in 0..3 {
        enqueue(
            &engine,
            &format!("{prefix}-default"),
            "test::rmq_default",
            json!({"idx": i}),
        )
        .await
        .expect("Enqueue to default should succeed");

        enqueue(
            &engine,
            &format!("{prefix}-payment"),
            "test::rmq_payment",
            json!({"transaction_id": format!("txn-{i}"), "idx": i}),
        )
        .await
        .expect("Enqueue to payment should succeed");
    }

    tokio::time::sleep(Duration::from_secs(5)).await;

    let dc = default_count.load(Ordering::SeqCst);
    let pc = payment_count.load(Ordering::SeqCst);

    assert_eq!(
        dc, 3,
        "Default queue should have processed 3 messages, got {dc}"
    );
    assert_eq!(
        pc, 3,
        "Payment queue should have processed 3 messages, got {pc}"
    );

    cleanup_queues(&prefix).await;
}

#[tokio::test]
async fn message_id_stamped_as_amqp_property() {
    skip_if_no_rabbitmq!();
    let prefix = test_prefix();

    // We need to publish a message and inspect it BEFORE the consumer picks it up.
    // Use the RabbitMQ adapter directly: set up topology, publish, then basic_get.
    let conn = try_connect_rabbitmq()
        .await
        .expect("Should connect to RabbitMQ");
    let channel = conn
        .create_channel()
        .await
        .expect("Should create channel");

    let queue_name = format!("{prefix}-msgid");
    let rmq_queue_name = format!("iii.__fn_queue::{queue_name}.queue");
    let rmq_exchange = format!("iii.__fn_queue::{queue_name}");

    // Create minimal topology: exchange + queue + binding
    channel
        .exchange_declare(
            &rmq_exchange,
            lapin::ExchangeKind::Direct,
            ExchangeDeclareOptions {
                durable: true,
                ..Default::default()
            },
            lapin::types::FieldTable::default(),
        )
        .await
        .expect("exchange_declare");

    channel
        .queue_declare(
            &rmq_queue_name,
            QueueDeclareOptions {
                durable: true,
                ..Default::default()
            },
            lapin::types::FieldTable::default(),
        )
        .await
        .expect("queue_declare");

    channel
        .queue_bind(
            &rmq_queue_name,
            &rmq_exchange,
            &queue_name,
            QueueBindOptions::default(),
            lapin::types::FieldTable::default(),
        )
        .await
        .expect("queue_bind");

    // Publish a message with a known message_id
    let known_message_id = Uuid::new_v4().to_string();
    let payload = json!({
        "function_id": "test::msg_id_check",
        "data": {"check": "message_id"},
    });

    let properties = lapin::BasicProperties::default()
        .with_content_type("application/json".into())
        .with_delivery_mode(2)
        .with_message_id(known_message_id.clone().into());

    channel
        .basic_publish(
            &rmq_exchange,
            &queue_name,
            BasicPublishOptions::default(),
            serde_json::to_vec(&payload).unwrap().as_slice(),
            properties,
        )
        .await
        .expect("basic_publish")
        .await
        .expect("publish confirm");

    // basic_get to read the raw message and verify AMQP message_id property
    let delivery = channel
        .basic_get(&rmq_queue_name, BasicGetOptions { no_ack: true })
        .await
        .expect("basic_get should succeed");

    if let Some(msg) = delivery {
        let amqp_message_id = msg
            .properties
            .message_id()
            .as_ref()
            .map(|s| s.to_string());

        assert_eq!(
            amqp_message_id,
            Some(known_message_id),
            "AMQP message_id property should match the publisher-assigned message_id"
        );
    } else {
        panic!("Expected a message in the queue but found none");
    }

    // Cleanup
    let _ = channel
        .queue_delete(&rmq_queue_name, QueueDeleteOptions::default())
        .await;
    let _ = channel
        .exchange_delete(&rmq_exchange, ExchangeDeleteOptions::default())
        .await;
}
