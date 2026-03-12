//! Integration tests for healthcheck endpoint registration.
//!
//! Requires a running III engine. Set III_URL and III_HTTP_URL, or use localhost defaults.

use std::time::Duration;

use serde_json::{Value, json};

use iii_sdk::III;

fn engine_ws_url() -> String {
    std::env::var("III_URL").unwrap_or_else(|_| "ws://localhost:49134".to_string())
}

fn engine_http_url() -> String {
    std::env::var("III_HTTP_URL").unwrap_or_else(|_| "http://localhost:3199".to_string())
}

async fn settle() {
    tokio::time::sleep(Duration::from_millis(300)).await;
}

fn http_client() -> reqwest::Client {
    reqwest::Client::new()
}

async fn get_health_status(http_url: &str) -> u16 {
    http_client()
        .get(format!("{http_url}/health"))
        .send()
        .await
        .map(|r| r.status().as_u16())
        .unwrap_or(0)
}

#[tokio::test]
async fn register_healthcheck_function_and_trigger() {
    let iii = III::new(&engine_ws_url());
    iii.connect().await.expect("connect");
    settle().await;

    let fn_ref = iii.register_function("test.healthcheck.rs", |_input: Value| async move {
        Ok(json!({
            "status_code": 200,
            "body": {
                "status": "healthy",
                "timestamp": "2026-01-01T00:00:00Z",
                "service": "iii-sdk-test",
            },
        }))
    });

    let status_before = get_health_status(&engine_http_url()).await;
    assert_eq!(status_before, 404, "expected 404 before trigger registration");

    let trigger = iii
        .register_trigger(
            "http",
            fn_ref.id.clone(),
            json!({
                "api_path": "health",
                "http_method": "GET",
                "description": "Healthcheck endpoint",
            }),
        )
        .expect("register trigger");

    let deadline = std::time::Instant::now() + Duration::from_secs(5);
    loop {
        let resp = http_client()
            .get(format!("{}/health", engine_http_url()))
            .send()
            .await
            .expect("request failed");

        if resp.status().as_u16() == 200 {
            let data: Value = resp.json().await.expect("json parse");
            assert_eq!(data["status"], "healthy");
            assert_eq!(data["service"], "iii-sdk-test");
            assert!(data["timestamp"].is_string());
            break;
        }

        if std::time::Instant::now() >= deadline {
            panic!("healthcheck endpoint never returned 200");
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    fn_ref.unregister();
    trigger.unregister();

    settle().await;

    let deadline = std::time::Instant::now() + Duration::from_secs(5);
    loop {
        let status_after = get_health_status(&engine_http_url()).await;
        if status_after == 404 {
            break;
        }
        if std::time::Instant::now() >= deadline {
            panic!("expected 404 after unregister, got {status_after}");
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    iii.shutdown_async().await;
}
