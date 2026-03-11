//! Integration tests for state operations.
//!
//! Requires a running III engine. Set III_BRIDGE_URL or use ws://localhost:49134 default.

use std::sync::Arc;
use std::time::Duration;

use serde_json::{Value, json};
use tokio::sync::Mutex;

use iii_sdk::{III, TriggerRequest};

fn engine_ws_url() -> String {
    std::env::var("III_BRIDGE_URL").unwrap_or_else(|_| "ws://localhost:49134".to_string())
}

async fn settle() {
    tokio::time::sleep(Duration::from_millis(300)).await;
}

const SCOPE: &str = "test-scope-rs";
const KEY: &str = "test-item";

async fn delete_state(iii: &III) {
    let _ = iii
        .trigger(TriggerRequest::new(
            "state::delete",
            json!({"scope": SCOPE, "key": KEY}),
        ))
        .await;
}

#[tokio::test]
async fn state_set_new_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii).await;

    let test_data = json!({"name": "Test Item", "value": 42});

    let result = iii
        .trigger(TriggerRequest::new(
            "state::set",
            json!({"scope": SCOPE, "key": KEY, "value": test_data}),
        ))
        .await
        .expect("state::set");

    assert_eq!(result["old_value"], Value::Null);
    assert_eq!(result["new_value"], test_data);

    delete_state(&iii).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_set_overwrite() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii).await;

    let initial_data = json!({"value": 1});
    let updated_data = json!({"value": 2, "updated": true});

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": KEY, "value": initial_data}),
    ))
    .await
    .expect("state::set initial");

    let result = iii
        .trigger(TriggerRequest::new(
            "state::set",
            json!({"scope": SCOPE, "key": KEY, "value": updated_data}),
        ))
        .await
        .expect("state::set overwrite");

    assert_eq!(result["old_value"], initial_data);
    assert_eq!(result["new_value"], updated_data);

    delete_state(&iii).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_get_existing_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii).await;

    let data = json!({"name": "Test", "value": 100});

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": KEY, "value": data}),
    ))
    .await
    .expect("state::set");

    let result = iii
        .trigger(TriggerRequest::new(
            "state::get",
            json!({"scope": SCOPE, "key": KEY}),
        ))
        .await
        .expect("state::get");

    assert_eq!(result, data);

    delete_state(&iii).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_get_non_existent_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let result = iii
        .trigger(TriggerRequest::new(
            "state::get",
            json!({"scope": SCOPE, "key": "non-existent-item"}),
        ))
        .await
        .expect("state::get non-existent");

    assert!(result.is_null());

    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_delete_existing_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii).await;

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": KEY, "value": {"test": true}}),
    ))
    .await
    .expect("state::set");

    iii.trigger(TriggerRequest::new(
        "state::delete",
        json!({"scope": SCOPE, "key": KEY}),
    ))
    .await
    .expect("state::delete");

    let result = iii
        .trigger(TriggerRequest::new(
            "state::get",
            json!({"scope": SCOPE, "key": KEY}),
        ))
        .await
        .expect("state::get after delete");

    assert!(result.is_null());

    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_delete_non_existent_item() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    iii.trigger(TriggerRequest::new(
        "state::delete",
        json!({"scope": SCOPE, "key": "non-existent"}),
    ))
    .await
    .expect("state::delete non-existent should not error");

    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_list_all_items_in_scope() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let scope = format!(
        "state-rs-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    let items = vec![
        json!({"id": "state-item1", "value": 1}),
        json!({"id": "state-item2", "value": 2}),
        json!({"id": "state-item3", "value": 3}),
    ];

    for item in &items {
        iii.trigger(TriggerRequest::new(
            "state::set",
            json!({"scope": scope, "key": item["id"], "value": item}),
        ))
        .await
        .expect("state::set");
    }

    let result = iii
        .trigger(TriggerRequest::new(
            "state::list",
            json!({"scope": scope}),
        ))
        .await
        .expect("state::list");

    let arr = result.as_array().expect("result should be array");
    assert!(arr.len() >= items.len());

    let mut result_sorted = arr.clone();
    result_sorted.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));

    let mut items_sorted = items.clone();
    items_sorted.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));

    assert_eq!(result_sorted, items_sorted);

    iii.shutdown_async().await;
}

#[tokio::test]
async fn reactive_state() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii).await;

    let data = json!({"name": "Test", "value": 100});
    let updated_data = json!({"name": "New Test Data", "value": 200});

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": KEY, "value": data}),
    ))
    .await
    .expect("state::set initial");

    let reactive_data: Arc<Mutex<Option<Value>>> = Arc::new(Mutex::new(None));
    let reactive_data_clone = reactive_data.clone();
    let (tx, rx) = tokio::sync::oneshot::channel::<()>();
    let tx = Arc::new(Mutex::new(Some(tx)));

    let fn_ref = iii.register_function("test.state.rs.updated", move |event: Value| {
        let reactive_data = reactive_data_clone.clone();
        let tx = tx.clone();
        async move {
            if event.get("type").and_then(|v| v.as_str()) == Some("state")
                && event.get("event_type").and_then(|v| v.as_str()) == Some("state:updated")
            {
                *reactive_data.lock().await = event.get("new_value").cloned();
                if let Some(sender) = tx.lock().await.take() {
                    let _ = sender.send(());
                }
            }
            Ok(json!({}))
        }
    });

    let trigger = iii
        .register_trigger(
            "state",
            &fn_ref.id,
            json!({"scope": SCOPE, "key": KEY}),
        )
        .expect("register state trigger");

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": KEY, "value": updated_data}),
    ))
    .await
    .expect("state::set updated");

    tokio::time::timeout(Duration::from_secs(5), rx)
        .await
        .expect("timeout waiting for reactive state event")
        .expect("channel error");

    let captured = reactive_data.lock().await.clone();
    assert_eq!(captured, Some(json!({"name": "New Test Data", "value": 200})));

    trigger.unregister();
    fn_ref.unregister();
    delete_state(&iii).await;
    iii.shutdown_async().await;
}
