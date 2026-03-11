//! Integration tests for KV server operations.
//!
//! Requires a running III engine. Set III_BRIDGE_URL or use ws://localhost:49134 default.

use std::time::Duration;

use serde_json::{Value, json};

use iii_sdk::{III, TriggerRequest};

fn engine_ws_url() -> String {
    std::env::var("III_BRIDGE_URL").unwrap_or_else(|_| "ws://localhost:49134".to_string())
}

async fn settle() {
    tokio::time::sleep(Duration::from_millis(300)).await;
}

fn unique_key(prefix: &str) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{prefix}_{ts}")
}

#[tokio::test]
async fn set_and_get_value() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let test_key = unique_key("test_key");
    let test_value = json!({"name": "test", "value": 123});

    iii.trigger(TriggerRequest::new(
        "kv_server::set",
        json!({"index": "test_index", "key": test_key, "value": test_value}),
    ))
    .await
    .expect("kv_server::set");

    let result = iii
        .trigger(TriggerRequest::new(
            "kv_server::get",
            json!({"index": "test_index", "key": test_key}),
        ))
        .await
        .expect("kv_server::get");

    assert_eq!(result, test_value);

    iii.shutdown_async().await;
}

#[tokio::test]
async fn delete_value() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let test_key = unique_key("delete_key");

    iii.trigger(TriggerRequest::new(
        "kv_server::set",
        json!({"index": "test_index", "key": test_key, "value": {"data": "to_delete"}}),
    ))
    .await
    .expect("kv_server::set");

    let before_delete = iii
        .trigger(TriggerRequest::new(
            "kv_server::get",
            json!({"index": "test_index", "key": test_key}),
        ))
        .await
        .expect("kv_server::get before delete");

    assert!(!before_delete.is_null());

    iii.trigger(TriggerRequest::new(
        "kv_server::delete",
        json!({"index": "test_index", "key": test_key}),
    ))
    .await
    .expect("kv_server::delete");

    let after_delete = iii
        .trigger(TriggerRequest::new(
            "kv_server::get",
            json!({"index": "test_index", "key": test_key}),
        ))
        .await
        .expect("kv_server::get after delete");

    assert!(after_delete.is_null());

    iii.shutdown_async().await;
}

#[tokio::test]
async fn list_values_in_index() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let test_index = unique_key("list_index");

    for i in 0..3 {
        iii.trigger(TriggerRequest::new(
            "kv_server::set",
            json!({"index": test_index, "key": format!("item_{i}"), "value": {"id": i}}),
        ))
        .await
        .expect("kv_server::set");
    }

    let result = iii
        .trigger(TriggerRequest::new(
            "kv_server::list",
            json!({"index": test_index}),
        ))
        .await
        .expect("kv_server::list");

    assert!(result.is_array());
    assert_eq!(result.as_array().unwrap().len(), 3);

    iii.shutdown_async().await;
}

#[tokio::test]
async fn get_non_existent_key() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let result = iii
        .trigger(TriggerRequest::new(
            "kv_server::get",
            json!({"index": "nonexistent_index", "key": "nonexistent_key"}),
        ))
        .await
        .expect("kv_server::get non-existent");

    assert!(result.is_null());

    iii.shutdown_async().await;
}
