# III SDK for Python

Python SDK for the III Engine.

## Installation

```bash
pip install iii-sdk
```

## Usage

```python
import asyncio
from iii import III

async def my_function(data):
    return {"result": "success"}

iii = III("ws://localhost:49134")
iii.register_function("my.function", my_function)

async def main():
    await iii.connect()

    result = await iii.call("other.function", {"param": "value"})
    print(result)

asyncio.run(main())
```

### Register API trigger

```python
import asyncio
from iii import III, ApiRequest, ApiResponse

iii = III("ws://localhost:49134")

async def create_todo(data):    
    req = ApiRequest(**data)
    return ApiResponse(status=201, data={"id": "123", "title": req.body.get("title")})

iii.register_function("api.post.todo", create_todo)

async def main():
    await iii.connect()

    iii.register_trigger(
        type="http",
        function_id="api.post.todo",
        config={
            "api_path": "/todo",
            "http_method": "POST",
            "description": "Create a new todo"
        }
    )

asyncio.run(main())
```

## Features

- WebSocket-based communication with III Engine
- Function registration and invocation
- Trigger registration
- Context-aware logging
- Async/await support
