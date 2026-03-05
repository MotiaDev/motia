# III SDK for Python

Python SDK for the III Engine.

## Installation

```bash
pip install iii-sdk
```

## Usage

```python
import asyncio
from iii import InitOptions, init


async def my_function(data):
    return {"result": "success"}


async def main():
    iii = init(
        "ws://localhost:49134",
        InitOptions(otel={"enabled": True, "service_name": "iii-python-worker"}),
    )
    iii.register_function("my.function", my_function)

    result = await iii.call("other.function", {"param": "value"})
    print(result)


asyncio.run(main())
```

### Register API trigger

```python
import asyncio
from iii import ApiRequest, ApiResponse, InitOptions, init


async def create_todo(data):
    req = ApiRequest(**data)
    return ApiResponse(status=201, data={"id": "123", "title": req.body.get("title")})


async def main():
    iii = init(
        "ws://localhost:49134",
        InitOptions(otel={"enabled": True, "service_name": "iii-python-worker"}),
    )

    iii.register_function("api.post.todo", create_todo)
    iii.register_trigger(
        type="http",
        function_id="api.post.todo",
        config={
            "api_path": "/todo",
            "http_method": "POST",
            "description": "Create a new todo",
        },
    )


asyncio.run(main())
```

## Features

- WebSocket-based communication with III Engine
- Function registration and invocation
- Trigger registration
- Context-aware logging
- Async/await support
