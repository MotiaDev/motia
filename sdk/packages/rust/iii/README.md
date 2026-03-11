# iii-sdk

Rust SDK for the [iii engine](https://github.com/iii-hq/iii).

[![crates.io](https://img.shields.io/crates/v/iii-sdk)](https://crates.io/crates/iii-sdk)
[![docs.rs](https://img.shields.io/docsrs/iii-sdk)](https://docs.rs/iii-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../../LICENSE)

## Install

Add to your `Cargo.toml`:

```toml
[dependencies]
iii-sdk = "0.3"
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

## Hello World

```rust
use iii_sdk::{init, InitOptions};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let iii = init("ws://127.0.0.1:49134", InitOptions::default())?;

    iii.register_function("greet", |input| async move {
        let name = input.get("name").and_then(|v| v.as_str()).unwrap_or("world");
        Ok(json!({ "message": format!("Hello, {name}!") }))
    });

    iii.register_trigger("http", "greet", json!({
        "api_path": "/greet",
        "http_method": "POST"
    }))?;

    let result: serde_json::Value = iii
        .trigger("greet", json!({ "name": "world" }))
        .await?;

    println!("result: {result}");
    Ok(())
}
```

## API

| Operation                | Signature                                    | Description                                            |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------ |
| Initialize               | `init(url, options)`                         | Create an SDK instance and auto-connect                |
| Register function        | `iii.register_function(id, \|input\| ...)`   | Register a function that can be invoked by name        |
| Register trigger         | `iii.register_trigger(type, fn_id, config)?` | Bind a trigger (HTTP, cron, queue, etc.) to a function |
| Invoke (await)           | `iii.trigger(id, data).await?`               | Invoke a function and wait for the result              |
| Invoke (fire-and-forget) | `iii.trigger_void(id, data)?`                | Invoke a function without waiting (fire-and-forget)    |

`init()` spawns a background task that handles WebSocket communication, automatic reconnection, and OpenTelemetry instrumentation.

### Registering Functions

```rust
iii.register_function("orders.create", |input| async move {
    let item = input["body"]["item"].as_str().unwrap_or("");
    Ok(json!({ "status_code": 201, "body": { "id": "123", "item": item } }))
});
```

### Registering Triggers

```rust
iii.register_trigger("http", "orders.create", json!({
    "api_path": "/orders",
    "http_method": "POST"
}))?;
```

### Invoking Functions

```rust
let result = iii.trigger("orders.create", json!({ "body": { "item": "widget" } })).await?;

iii.trigger_void("analytics.track", json!({ "event": "page_view" }))?;
```

### Streams

```rust
use iii_sdk::{init, InitOptions, Streams};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let iii = init("ws://127.0.0.1:49134", InitOptions::default())?;

    let streams = Streams::new(iii.clone());
    streams.set_field("room::123", "users", json!(["alice", "bob"])).await?;

    Ok(())
}
```

### OpenTelemetry

Enable the `otel` feature for full tracing and metrics support:

```toml
[dependencies]
iii-sdk = { version = "0.3", features = ["otel"] }
```

## Modules

| Import               | What it provides                                    |
| -------------------- | --------------------------------------------------- |
| `iii_sdk`            | Core SDK (`III`, types)                             |
| `iii_sdk::stream`    | Stream client (`Streams`, `UpdateBuilder`)          |
| `iii_sdk::telemetry` | OpenTelemetry integration (requires `otel` feature) |

## Deprecated

`call()` and `call_void()` are deprecated aliases for `trigger()` and `trigger_void()`. They still work but will be removed in a future release.

## Resources

- [Documentation](https://iii.dev/docs)
- [iii Engine](https://github.com/iii-hq/iii)
- [Examples](https://github.com/iii-hq/iii-examples)
