# III SDK

Multi-language SDK for the III Engine - a WebSocket-based function orchestration platform.

## Overview

The III SDK provides a unified interface for building distributed applications with function registration, invocation, and trigger management. It enables seamless communication between services through a WebSocket-based engine.

## Supported Languages

- **Node.js** - TypeScript/JavaScript SDK with full async support
- **Python** - Async Python SDK with function registration
- **Rust** - High-performance async Rust SDK with automatic reconnection

## Features

- **Function Registration** - Register callable functions that can be invoked by other services
- **Function Invocation** - Call functions synchronously or asynchronously (fire-and-forget)
- **Trigger Management** - Create and manage triggers (API, events, schedules, etc.)
- **Custom Trigger Types** - Define your own trigger types with custom logic
- **Context-Aware Logging** - Built-in logging with execution context
- **OpenTelemetry Integration** - Full observability with traces, metrics, and logs (Node.js)
- **Automatic Reconnection** - Resilient WebSocket connections with auto-reconnect (Rust)

## Quick Start

### Node.js

```bash
npm install iii-sdk
```

```javascript
import { III } from 'iii-sdk'

const iii = new III('ws://localhost:49134')

iii.registerFunction({ id: 'myFunction' }, (req) => {
  return { status_code: 200, body: { message: 'Hello, world!' } }
})

iii.registerTrigger({
  type: 'http',
  function_id: 'myFunction',
  config: { api_path: '/hello', http_method: 'POST' },
})

const result = await iii.call('myFunction', { param: 'value' })
```

### Python

```bash
pip install iii-sdk
```

```python
from iii import III

iii = III("ws://localhost:49134")

async def my_function(data):
    return {"result": "success"}

iii.register_function("my.function", my_function)

result = await iii.call("other.function", {"param": "value"})
```

### Rust

```toml
[dependencies]
iii-sdk = { path = "path/to/iii" }
```

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

## Documentation

Detailed documentation for each SDK:

- [Node.js SDK](./packages/node/iii/README.md)
- [Python SDK](./packages/python/iii/README.md)
- [Rust SDK](./packages/rust/iii/README.md)

## Examples

Example applications demonstrating SDK usage:

- [Node.js Example](./packages/node/iii-example/)
- [Python Example](./packages/python/iii-example/)
- [Rust Example](./packages/rust/iii-example/)

## Development

### Prerequisites

- Node.js 20+ and pnpm (for Node.js SDK)
- Python 3.8+ and uv (for Python SDK)
- Rust 1.70+ and Cargo (for Rust SDK)
- III Engine running on `ws://localhost:49134`

### Building

```bash
cd packages/node && pnpm install && pnpm build
cd packages/python/iii && python -m build
cd packages/rust/iii && cargo build --release
```

### Testing

```bash
cd packages/node && pnpm test
cd packages/python/iii && pytest
cd packages/rust/iii && cargo test
```

## Architecture

The III SDK communicates with the III Engine via WebSocket connections. The engine acts as a central orchestrator for:

- Function registry and routing
- Trigger management and execution
- Inter-service communication
- Telemetry and observability

## License

Apache License 2.0 - see [LICENSE](./LICENSE) for details.

## Author

Motia LLC
