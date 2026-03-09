![iii - One Engine, Three Primitives](engine/assets/banner.jpg)

[![License](https://img.shields.io/badge/license-ELv2-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/docker/v/iiidev/iii?label=docker)](https://hub.docker.com/r/iiidev/iii)
[![npm](https://img.shields.io/npm/v/iii-sdk?label=npm)](https://www.npmjs.com/package/iii-sdk)
[![PyPI](https://img.shields.io/pypi/v/iii-sdk?label=pypi)](https://pypi.org/project/iii-sdk/)
[![Crates.io](https://img.shields.io/crates/v/iii-sdk?label=crates.io)](https://crates.io/crates/iii-sdk)

## What is iii

You start building a backend and immediately need six different tools: an API framework, a task queue, a cron scheduler, pub/sub, a state store, and an observability pipeline. Each has its own config, its own deployment, its own failure modes. A simple "process this, then notify that" workflow touches three services before you write any business logic.

iii replaces all of that with a single engine and two primitives: **Function** and **Trigger**.

A Function is anything that does work. A Trigger is what causes it to run - an HTTP request, a cron schedule, a queue message, a state change. You write the function, declare what triggers it, and the engine handles discovery, routing, retries, and observability.

One config file. One process. Everything discoverable. Think of it the way React gave frontend a single model for UI - iii gives your backend a single model for execution.

## Three Concepts

| Concept       | What it does |
| ------------- | ------------ |
| **Function**  | A unit of work. It receives input and optionally returns output. It can exist anywhere: locally, in the cloud, on serverless, or as a third-party HTTP endpoint. |
| **Trigger**   | What causes a Function to run - explicitly from code, or automatically from an event source. Examples: HTTP route, cron schedule, queue topic, state change, stream event. |
| **Discovery** | Functions and triggers register and deregister themselves without configuration. Once discovered, they are available across the entire backend. |

## Quick Start

```bash
curl -fsSL https://install.iii.dev/iii/main/install.sh | sh
iii-cli start
```

Your engine is running at `ws://localhost:49134` with HTTP API at `http://localhost:3111`.

### Connect a worker

```bash
npm install iii-sdk
```

```javascript
import { init, getContext } from 'iii-sdk';

const iii = init('ws://localhost:49134');
const { logger } = getContext();

iii.registerFunction({ id: 'math.add' }, async (input) => {
  return { sum: input.a + input.b };
});

iii.registerTrigger({
  type: 'http',
  function_id: 'math.add',
  config: { api_path: 'add', http_method: 'POST' },
});

const result = await iii.trigger('math.add', { a: 1, b: 2 });
logger.info('result', result); // { sum: 3 }
```

Your function is now live at `http://localhost:3111/add`.

<details>
<summary>Python</summary>

```bash
pip install iii-sdk
```

```python
import asyncio
from iii import init, get_context

async def main():
    iii = init("ws://localhost:49134")
    logger = get_context().logger

    async def add(data):
        return {"sum": data["a"] + data["b"]}

    iii.register_function("math.add", add)

    iii.register_trigger(
        type="http",
        function_id="math.add",
        config={"api_path": "add", "http_method": "POST"}
    )

    result = await iii.trigger("math.add", {"a": 1, "b": 2})
    logger.info("result", result)  # {"sum": 3}

asyncio.run(main())
```

</details>

<details>
<summary>Rust</summary>

```rust
use iii_sdk::{init, InitOptions, get_context};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let iii = init("ws://127.0.0.1:49134", InitOptions::default())?;

    iii.register_function("math.add", |input| async move {
        let a = input.get("a").and_then(|v| v.as_i64()).unwrap_or(0);
        let b = input.get("b").and_then(|v| v.as_i64()).unwrap_or(0);
        Ok(json!({ "sum": a + b }))
    });

    iii.register_trigger("http", "math.add", json!({
        "api_path": "add",
        "http_method": "POST"
    }))?;

    let result = iii.trigger("math.add", json!({ "a": 1, "b": 2 })).await?;
    let logger = get_context().logger;
    logger.info("result", &result); // {"sum":3}

    Ok(())
}
```

</details>

## SDKs

| Language | Package                                            | Install               |
| -------- | -------------------------------------------------- | --------------------- |
| Node.js  | [`iii-sdk`](https://www.npmjs.com/package/iii-sdk) | `npm install iii-sdk` |
| Python   | [`iii-sdk`](https://pypi.org/project/iii-sdk/)     | `pip install iii-sdk` |
| Rust     | [`iii-sdk`](https://crates.io/crates/iii-sdk)      | Add to `Cargo.toml`   |

## Console

The [iii-console](console/) is a developer and operations dashboard for inspecting functions, triggers, traces, and real-time state.

```bash
iii-cli console
```

![iii console dashboard](https://raw.githubusercontent.com/iii-hq/docs/main/public/docs/console/dashboard-dark.png)

## Repository Structure

| Directory      | What it is                                              | README                                  |
| -------------- | ------------------------------------------------------- | --------------------------------------- |
| `engine/`      | iii Engine (Rust) - core runtime, modules, and protocol | [engine/README.md](engine/README.md)    |
| `sdk/`         | SDKs for Node.js, Python, and Rust                      | [sdk/README.md](sdk/README.md)          |
| `console/`     | Developer dashboard (React + Rust)                      | [console/README.md](console/README.md)  |
| `frameworks/`  | Higher-level frameworks built on the SDK                 | [frameworks/motia/](frameworks/motia/)  |
| `website/`     | iii website                                              | [website/](website/)                    |
| `docs/`        | Documentation site (Fumadocs/MDX)                       | [docs/README.md](docs/README.md)        |

See [STRUCTURE.md](STRUCTURE.md) for the full monorepo layout, dependency chain, and CI/CD details.

## Examples

See the [Quickstart guide](https://iii.dev/docs/quickstart) for step-by-step tutorials.

## Resources

- [Documentation](https://iii.dev/docs)
- [CLI](https://github.com/iii-hq/iii-cli)
- [Console](console/)
- [Examples](https://github.com/iii-hq/iii-examples)
- [Contributing](CONTRIBUTING.md)

## License

[Elastic License 2.0 (ELv2)](LICENSE)
