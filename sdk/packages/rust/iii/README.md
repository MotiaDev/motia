# III SDK for Rust

Rust SDK for the III Engine.

## Installation

Add the crate to your `Cargo.toml`:

```toml
[dependencies]
iii-sdk = { path = "../path/to/iii" }
```

## Usage

```rust
use iii_sdk::III;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let iii = III::new("ws://127.0.0.1:49134");
    iii.connect().await?;

    iii.register_function("my.function", |input| async move {
        Ok(json!({ "message": "Hello, world!", "input": input }))
    });

    let result: serde_json::Value = iii
        .call("my.function", json!({ "param": "value" }))
        .await?;

    println!("result: {result}");
    Ok(())
}
```

## Features

- WebSocket-based communication with III Engine
- Function registration and invocation
- Trigger registration and trigger type handling
- Context-aware logging (`get_context().logger`)
- Async/await support with automatic reconnection

## Notes

- `III::connect` starts a background task and handles reconnection automatically.
- The engine protocol currently supports `registertriggertype` but does not include an
  `unregistertriggertype` message; `unregister_trigger_type` only removes local handlers.
