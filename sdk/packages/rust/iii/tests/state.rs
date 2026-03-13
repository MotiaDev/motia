//! Integration tests for state operations.
//!
//! Requires a running III engine. Set III_URL or use ws://localhost:49134 default.

use std::sync::Arc;
use std::time::Duration;

use serde_json::{Value, json};
use tokio::sync::Mutex;

use iii_sdk::{III, TriggerRequest};

fn engine_ws_url() -> String {
    std::env::var("III_URL").unwrap_or_else(|_| "ws://localhost:49134".to_string())
}

async fn settle() {
    tokio::time::sleep(Duration::from_millis(300)).await;
}

const SCOPE: &str = "test-scope-rs";

fn unique_key(test_name: &str) -> String {
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{test_name}-{ts}")
}

async fn delete_state(iii: &III, key: &str) {
    let _ = iii
        .trigger(TriggerRequest::new(
            "state::delete",
            json!({"scope": SCOPE, "key": key}),
        ))
        .await;
}

#[tokio::test]
async fn state_set_new_item() {
    let key = unique_key("set-new");
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii, &key).await;

    let test_data = json!({"name": "Test Item", "value": 42});

    let result = iii
        .trigger(TriggerRequest::new(
            "state::set",
            json!({"scope": SCOPE, "key": key, "value": test_data}),
        ))
        .await
        .expect("state::set");

    assert_eq!(result["old_value"], Value::Null);
    assert_eq!(result["new_value"], test_data);

    delete_state(&iii, &key).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_set_overwrite() {
    let key = unique_key("set-overwrite");
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii, &key).await;

    let initial_data = json!({"value": 1});
    let updated_data = json!({"value": 2, "updated": true});

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": key, "value": initial_data}),
    ))
    .await
    .expect("state::set initial");

    let result = iii
        .trigger(TriggerRequest::new(
            "state::set",
            json!({"scope": SCOPE, "key": key, "value": updated_data}),
        ))
        .await
        .expect("state::set overwrite");

    assert_eq!(result["old_value"], initial_data);
    assert_eq!(result["new_value"], updated_data);

    delete_state(&iii, &key).await;
    iii.shutdown_async().await;
}

#[tokio::test]
async fn state_get_existing_item() {
    let key = unique_key("get-existing");
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii, &key).await;

    let data = json!({"name": "Test", "value": 100});

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": key, "value": data}),
    ))
    .await
    .expect("state::set");

    let result = iii
        .trigger(TriggerRequest::new(
            "state::get",
            json!({"scope": SCOPE, "key": key}),
        ))
        .await
        .expect("state::get");

    assert_eq!(result, data);

    delete_state(&iii, &key).await;
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
    let key = unique_key("delete-existing");
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii, &key).await;

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": key, "value": {"test": true}}),
    ))
    .await
    .expect("state::set");

    iii.trigger(TriggerRequest::new(
        "state::delete",
        json!({"scope": SCOPE, "key": key}),
    ))
    .await
    .expect("state::delete");

    let result = iii
        .trigger(TriggerRequest::new(
            "state::get",
            json!({"scope": SCOPE, "key": key}),
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
        iii.trigger(TriggerRequest {
            function_id: "state::set".to_string(),
            payload: json!({"scope": scope, "key": item["id"], "value": item}),
            action: None,
            timeout_ms: None,
        })
        .await
        .expect("state::set");
    }
    let result = iii
        .trigger(TriggerRequest {
            function_id: "state::list".to_string(),
            payload: json!({"scope": scope}),
            action: None,
            timeout_ms: None,
        })
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
    let key = unique_key("reactive");
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;
    delete_state(&iii, &key).await;

    let data = json!({"name": "Test", "value": 100});
    let updated_data = json!({"name": "New Test Data", "value": 200});

    iii.trigger(TriggerRequest::new(
        "state::set",
        json!({"scope": SCOPE, "key": key, "value": data}),
    ))
    .await
    .expect("state::set initial");

    let reactive_data: Arc<Mutex<Option<Value>>> = Arc::new(Mutex::new(None));
    let reactive_data_clone = reactive_data.clone();

    let fn_ref = iii.register_function("test.state.rs.updated", move |event: Value| {
        let reactive_data = reactive_data_clone.clone();
        async move {
            if event.get("type").and_then(|v| v.as_str()) == Some("state")
                && event.get("event_type").and_then(|v| v.as_str()) == Some("state:updated")
            {
                *reactive_data.lock().await = event.get("new_value").cloned();
            }
            Ok(json!({}))
        }
    });

    let key_clone = key.clone();
    let trigger = iii
        .register_trigger(
            "state",
            &fn_ref.id,
            json!({"scope": SCOPE, "key": key_clone}),
        )
        .expect("register state trigger");

    // Poll: re-trigger state::set each attempt until the handler fires.
    // Trigger registration is async so the first few sets may not be observed.
    let expected = Some(json!({"name": "New Test Data", "value": 200}));
    for attempt in 0..100 {
        iii.trigger(TriggerRequest::new(
            "state::set",
            json!({"scope": SCOPE, "key": key, "value": updated_data}),
        ))
        .await
        .expect("state::set updated");

        let captured = reactive_data.lock().await.clone();
        if captured == expected {
            break;
        }
        if attempt == 99 {
            panic!(
                "reactive state not updated after 100 attempts: got {:?}, expected {:?}",
                captured, expected
            );
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    trigger.unregister();
    fn_ref.unregister();
    delete_state(&iii, &key).await;
    iii.shutdown_async().await;
}
