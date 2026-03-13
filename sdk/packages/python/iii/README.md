# iii-sdk

Python SDK for the [iii engine](https://github.com/iii-hq/iii).

[![PyPI](https://img.shields.io/pypi/v/iii-sdk)](https://pypi.org/project/iii-sdk/)
[![Python](https://img.shields.io/pypi/pyversions/iii-sdk)](https://pypi.org/project/iii-sdk/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../../LICENSE)

## Install

```bash
pip install iii-sdk
```

## Hello World

```python
import asyncio
from iii import init

async def main():
    iii = init("ws://localhost:49134")

    async def greet(data):
        return {"message": f"Hello, {data['name']}!"}

    iii.register_function("greet", greet)

    iii.register_trigger(
        type="http",
        function_id="greet",
        config={"api_path": "/greet", "http_method": "POST"}
    )

    result = await iii.trigger({"function_id": "greet", "payload": {"name": "world"}})
    print(result)

asyncio.run(main())
```

## API

| Operation                | Signature                                         | Description                                            |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Initialize               | `init(url, options?)`                             | Create an SDK instance and auto-connect                |
| Register function        | `iii.register_function(id, handler)`              | Register a function that can be invoked by name        |
| Register trigger         | `iii.register_trigger(type, function_id, config)` | Bind a trigger (HTTP, cron, queue, etc.) to a function |
| Invoke (await)           | `await iii.trigger({"function_id": id, "payload": data})` | Invoke a function and wait for the result              |
| Invoke (fire-and-forget) | `iii.trigger({"function_id": id, "payload": data, "action": TriggerAction.Void()})` | Invoke a function without waiting (fire-and-forget)    |

`init()` must be called inside an async context. It creates the SDK instance and auto-connects to the engine.

### Registering Functions

```python
async def create_order(data):
    return {"status_code": 201, "body": {"id": "123", "item": data["body"]["item"]}}

iii.register_function("orders.create", create_order)
```

### Registering Triggers

```python
iii.register_trigger(
    type="http",
    function_id="orders.create",
    config={"api_path": "/orders", "http_method": "POST"}
)
```

### Invoking Functions

```python
from iii import TriggerAction

result = await iii.trigger({"function_id": "orders.create", "payload": {"body": {"item": "widget"}}})

iii.trigger({"function_id": "analytics.track", "payload": {"event": "page_view"}, "action": TriggerAction.Void()})
```

## Modules

| Import          | What it provides                  |
| --------------- | --------------------------------- |
| `iii`           | Core SDK (`III`, types)           |
| `iii.stream`    | Stream client for real-time state |
| `iii.telemetry` | OpenTelemetry integration         |

## Development

### Install in development mode

```bash
pip install -e .
```

### Type checking

```bash
mypy src
```

### Linting

```bash
ruff check src
```

## Deprecated

`call`, `call_void`, and `trigger_void` have been removed. Use `trigger()` for all invocations. For fire-and-forget, use `trigger({"function_id": ..., "payload": ..., "action": TriggerAction.Void()})`.

## Resources

- [Documentation](https://iii.dev/docs)
- [iii Engine](https://github.com/iii-hq/iii)
- [Examples](https://github.com/iii-hq/iii-examples)
