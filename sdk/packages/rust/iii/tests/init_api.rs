use iii_sdk::{IIIError, InitOptions, init};

#[test]
fn init_without_runtime_returns_runtime_error() {
    match init("ws://127.0.0.1:49134", InitOptions::default()) {
        Err(IIIError::Runtime(_)) => {}
        Err(other) => panic!("expected Runtime error, got {other:?}"),
        Ok(_) => panic!("expected init to fail without Tokio runtime"),
    }
}

#[tokio::test]
async fn init_with_runtime_returns_sdk_instance() {
    let client = init("ws://127.0.0.1:49134", InitOptions::default())
        .expect("init should succeed inside Tokio runtime");

    // API should remain usable immediately after init()
    client.register_function("test.echo", |input| async move { Ok(input) });
}

#[cfg(feature = "otel")]
#[tokio::test]
async fn init_applies_otel_config_before_auto_connect() {
    use iii_sdk::OtelConfig;

    let client = init(
        "ws://127.0.0.1:49134",
        InitOptions {
            otel: Some(OtelConfig {
                service_name: Some("iii-rust-init-test".to_string()),
                ..Default::default()
            }),
            ..Default::default()
        },
    )
    .expect("init should succeed");

    client.register_function("test.echo.otel", |input| async move { Ok(input) });
}
