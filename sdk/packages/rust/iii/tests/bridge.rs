//! Integration tests for bridge operations.
//!
//! Requires a running III engine. Set III_URL or use ws://localhost:49134 default.

use std::sync::Arc;
use std::time::Duration;

use serde_json::{Value, json};
use tokio::sync::Mutex;

use iii_sdk::{FunctionInfo, III, TriggerAction, TriggerRequest};

fn engine_ws_url() -> String {
    std::env::var("III_URL").unwrap_or_else(|_| "ws://localhost:49134".to_string())
}

async fn settle() {
    tokio::time::sleep(Duration::from_millis(300)).await;
}

#[tokio::test]
async fn connect_successfully() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let functions: Vec<FunctionInfo> = iii.list_functions().await.expect("list_functions");
    // Just verify it returns a valid list (may be empty if no functions registered)
    let _ = functions;

    iii.shutdown_async().await;
}

#[tokio::test]
async fn register_and_invoke_function() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let received = Arc::new(Mutex::new(Vec::new()));
    let received_clone = received.clone();

    let fn_ref = iii.register_function("test.bridge.rs.echo", move |input: Value| {
        let received = received_clone.clone();
        async move {
            received.lock().await.push(input.clone());
            Ok(json!({ "echoed": input }))
        }
    });

    settle().await;

    let result = iii
        .trigger(TriggerRequest::new(
            "test.bridge.rs.echo",
            json!({"message": "hello"}),
        ))
        .await
        .expect("trigger");

    assert_eq!(result["echoed"]["message"], "hello");
    assert_eq!(received.lock().await[0]["message"], "hello");

    fn_ref.unregister();
    iii.shutdown_async().await;
}

#[tokio::test]
async fn invoke_function_fire_and_forget() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let received = Arc::new(Mutex::new(Vec::new()));
    let received_clone = received.clone();
    let (tx, rx) = tokio::sync::oneshot::channel::<()>();
    let tx = Arc::new(Mutex::new(Some(tx)));

    let fn_ref = iii.register_function("test.bridge.rs.receiver", move |input: Value| {
        let received = received_clone.clone();
        let tx = tx.clone();
        async move {
            received.lock().await.push(input);
            if let Some(sender) = tx.lock().await.take() {
                let _ = sender.send(());
            }
            Ok(json!({}))
        }
    });

    settle().await;

    let result = iii
        .trigger(
            TriggerRequest::new("test.bridge.rs.receiver", json!({"value": 42}))
                .action(TriggerAction::Void),
        )
        .await
        .expect("void trigger");

    assert!(result.is_null());

    tokio::time::timeout(Duration::from_secs(5), rx)
        .await
        .expect("timeout waiting for fire-and-forget")
        .expect("channel error");

    assert_eq!(received.lock().await[0]["value"], 42);

    fn_ref.unregister();
    iii.shutdown_async().await;
}

#[tokio::test]
async fn list_registered_functions() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let fn1 = iii.register_function("test.bridge.rs.list.func1", |_: Value| async move {
        Ok(json!({}))
    });
    let fn2 = iii.register_function("test.bridge.rs.list.func2", |_: Value| async move {
        Ok(json!({}))
    });

    settle().await;

    let functions: Vec<FunctionInfo> = iii.list_functions().await.expect("list_functions");
    let ids: Vec<&str> = functions.iter().map(|f| f.function_id.as_str()).collect();

    assert!(ids.contains(&"test.bridge.rs.list.func1"));
    assert!(ids.contains(&"test.bridge.rs.list.func2"));

    fn1.unregister();
    fn2.unregister();
    iii.shutdown_async().await;
}

#[tokio::test]
async fn reject_non_existent_function() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let result = iii
        .trigger(TriggerRequest::new("nonexistent.function.rs", json!({})).timeout_ms(2000))
        .await;

    assert!(result.is_err());

    iii.shutdown_async().await;
}
