//! Integration tests for stream operations.
//!
//! Requires a running III engine. Set III_URL or use ws://localhost:49134 default.

use std::time::Duration;

use serde_json::{Value, json};

use iii_sdk::{III, TriggerRequest};

fn engine_ws_url() -> String {
    std::env::var("III_URL").unwrap_or_else(|_| "ws://localhost:49134".to_string())
}

async fn settle() {
    tokio::time::sleep(Duration::from_millis(300)).await;
}

const STREAM_NAME: &str = "test-stream-rs";
const GROUP_ID: &str = "test-group";
const ITEM_ID: &str = "test-item";

async fn delete_stream_item(iii: &III) {
    let _ = iii
        .trigger(TriggerRequest::new(
            "stream::delete",
            json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID}),
        ))
        .await;
}

#[tokio::test]
async fn stream_set_new_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_stream_item(&iii).await;

    let test_data = json!({"name": "Test Item", "value": 42});

    let result = iii
        .trigger(TriggerRequest::new(
            "stream::set",
            json!({
                "stream_name": STREAM_NAME,
                "group_id": GROUP_ID,
                "item_id": ITEM_ID,
                "data": test_data,
            }),
        ))
        .await
        .expect("stream::set");

    assert_eq!(result["old_value"], Value::Null);
    assert_eq!(result["new_value"], test_data);

    delete_stream_item(&iii).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn stream_set_overwrite() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_stream_item(&iii).await;

    let initial_data = json!({"value": 1});
    let updated_data = json!({"value": 2, "updated": true});

    iii.trigger(TriggerRequest::new(
        "stream::set",
        json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID, "data": initial_data}),
    ))
    .await
    .expect("stream::set initial");

    let result = iii
        .trigger(TriggerRequest::new(
            "stream::set",
            json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID, "data": updated_data}),
        ))
        .await
        .expect("stream::set overwrite");

    assert_eq!(result["old_value"], initial_data);
    assert_eq!(result["new_value"], updated_data);

    delete_stream_item(&iii).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn stream_get_existing_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_stream_item(&iii).await;

    let test_data = json!({"name": "Test", "value": 100});

    iii.trigger(TriggerRequest::new(
        "stream::set",
        json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID, "data": test_data}),
    ))
    .await
    .expect("stream::set");

    let result = iii
        .trigger(TriggerRequest::new(
            "stream::get",
            json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID}),
        ))
        .await
        .expect("stream::get");

    assert_eq!(result, test_data);

    delete_stream_item(&iii).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn stream_get_non_existent_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let result = iii
        .trigger(TriggerRequest::new(
            "stream::get",
            json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": "non-existent-item"}),
        ))
        .await
        .expect("stream::get non-existent");

    assert!(result.is_null());

    iii.shutdown_async().await;
}

#[tokio::test]
async fn stream_delete_existing_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_stream_item(&iii).await;

    iii.trigger(TriggerRequest::new(
        "stream::set",
        json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID, "data": {"test": true}}),
    ))
    .await
    .expect("stream::set");

    iii.trigger(TriggerRequest::new(
        "stream::delete",
        json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID}),
    ))
    .await
    .expect("stream::delete");

    let result = iii
        .trigger(TriggerRequest::new(
            "stream::get",
            json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": ITEM_ID}),
        ))
        .await
        .expect("stream::get after delete");

    assert!(result.is_null());

    iii.shutdown_async().await;
}

#[tokio::test]
async fn stream_delete_non_existent_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    iii.trigger(TriggerRequest::new(
        "stream::delete",
        json!({"stream_name": STREAM_NAME, "group_id": GROUP_ID, "item_id": "non-existent"}),
    ))
    .await
    .expect("stream::delete non-existent should not error");

    iii.shutdown_async().await;
}

#[tokio::test]
async fn stream_list_items_in_group() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let group_id = format!(
        "stream-rs-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    let items = vec![
        json!({"id": "stream-item1", "value": 1}),
        json!({"id": "stream-item2", "value": 2}),
        json!({"id": "stream-item3", "value": 3}),
    ];

    for item in &items {
        iii.trigger(TriggerRequest::new(
            "stream::set",
            json!({
                "stream_name": STREAM_NAME,
                "group_id": group_id,
                "item_id": item["id"],
                "data": item,
            }),
        ))
        .await
        .expect("stream::set");
    }

    let result = iii
        .trigger(TriggerRequest::new(
            "stream::list",
            json!({"stream_name": STREAM_NAME, "group_id": group_id}),
        ))
        .await
        .expect("stream::list");

    let arr = result.as_array().expect("result should be array");
    assert!(arr.len() >= items.len());

    let mut result_sorted = arr.clone();
    result_sorted.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));

    let mut items_sorted = items.clone();
    items_sorted.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));

    assert_eq!(result_sorted, items_sorted);

    iii.shutdown_async().await;
}
