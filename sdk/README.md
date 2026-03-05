# iii SDK

Official SDKs for the [iii engine](https://github.com/iii-hq/iii).

[![npm](https://img.shields.io/npm/v/iii-sdk)](https://www.npmjs.com/package/iii-sdk)
[![PyPI](https://img.shields.io/pypi/v/iii-sdk)](https://pypi.org/project/iii-sdk/)
[![crates.io](https://img.shields.io/crates/v/iii-sdk)](https://crates.io/crates/iii-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Installing Packages

| Package                                            | Language             | Install               | Docs                                      |
| -------------------------------------------------- | -------------------- | --------------------- | ----------------------------------------- |
| [`iii-sdk`](https://www.npmjs.com/package/iii-sdk) | Node.js / TypeScript | `npm install iii-sdk` | [README](./packages/node/iii/README.md)   |
| [`iii-sdk`](https://pypi.org/project/iii-sdk/)     | Python               | `pip install iii-sdk` | [README](./packages/python/iii/README.md) |
| [`iii-sdk`](https://crates.io/crates/iii-sdk)      | Rust                 | Add to `Cargo.toml`   | [README](./packages/rust/iii/README.md)   |

## Hello World

### Node.js

```javascript
import { init } from 'iii-sdk';

const iii = init('ws://localhost:49134');

iii.registerFunction({ id: 'greet' }, async (input) => {
  return { message: `Hello, ${input.name}!` };
});

iii.registerTrigger({
  type: 'http',
  function_id: 'greet',
  config: { api_path: '/greet', http_method: 'POST' },
});

const result = await iii.trigger('greet', { name: 'world' });
```

### Python

```python
import asyncio
from iii import III

iii = III("ws://localhost:49134")

async def greet(data):
    return {"message": f"Hello, {data['name']}!"}

iii.register_function("greet", greet)

async def main():
    await iii.connect()

    iii.register_trigger(
        type="http",
        function_id="greet",
        config={"api_path": "/greet", "http_method": "POST"}
    )

    result = await iii.trigger("greet", {"name": "world"})

asyncio.run(main())
```

### Rust

```rust
use iii_sdk::III;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let iii = III::new("ws://127.0.0.1:49134");
    iii.connect().await?;

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

    Ok(())
}
```

## API

| Operation                | Node.js                                              | Python                                      | Rust                                         | Description                                            |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Initialize               | `init(url)`                                          | `III(url)`                                  | `III::new(url)`                              | Create an SDK instance and connect to the engine       |
| Connect                  | Auto on `init()`                                     | `await iii.connect()`                       | `iii.connect().await?`                       | Open the WebSocket connection                          |
| Register function        | `iii.registerFunction({ id }, handler)`              | `iii.register_function(id, handler)`        | `iii.register_function(id, \|input\| ...)`   | Register a function that can be invoked by name        |
| Register trigger         | `iii.registerTrigger({ type, function_id, config })` | `iii.register_trigger(type, fn_id, config)` | `iii.register_trigger(type, fn_id, config)?` | Bind a trigger (HTTP, cron, queue, etc.) to a function |
| Invoke (await)           | `await iii.trigger(id, data)`                        | `await iii.trigger(id, data)`               | `iii.trigger(id, data).await?`               | Invoke a function and wait for the result              |
| Invoke (fire-and-forget) | `iii.triggerVoid(id, data)`                          | `iii.trigger_void(id, data)`                | `iii.trigger_void(id, data)?`                | Invoke a function without waiting                      |

> `call()` and `callVoid()` / `call_void()` are deprecated and will be removed in a future release. Use `trigger()` and `triggerVoid()` / `trigger_void()`.

## Development

### Prerequisites

- Node.js 20+ and pnpm (for Node.js SDK)
- Python 3.10+ and uv (for Python SDK)
- Rust 1.85+ and Cargo (for Rust SDK)
- iii engine running on `ws://localhost:49134`

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

## Examples

See the [Quickstart guide](https://iii.dev/docs/quickstart) for step-by-step tutorials.

## Resources

- [Documentation](https://iii.dev/docs)
- [iii Engine](https://github.com/iii-hq/iii)
- [Examples](https://github.com/iii-hq/iii-examples)

## License

Apache 2.0
