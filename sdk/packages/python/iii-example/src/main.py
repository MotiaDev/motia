import asyncio
import json
import random
import string
import time
import urllib.request
from datetime import datetime, timezone
from typing import Any

from iii import ApiRequest, ApiResponse

state: Any = None
streams: Any = None


def _generate_todo_id() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
    return f"todo-{int(time.time() * 1000)}-{suffix}"


def _setup() -> None:
    from .hooks import use_api, use_functions_available
    from .state import state as state_client
    from .stream import register_streams
    from .stream import streams as streams_client

    global state, streams
    state = state_client
    streams = streams_client
    register_streams()

    use_functions_available(
        lambda functions: print(
            "--------------------------------\n"
            f"Functions available: {len(functions)}\n"
            "--------------------------------"
        )
    )

    use_api(
        {"api_path": "todo", "http_method": "POST", "description": "Create a new todo", "metadata": {"tags": ["todo"]}},
        _create_todo,
    )

    use_api(
        {"api_path": "todo", "http_method": "DELETE", "description": "Delete a todo", "metadata": {"tags": ["todo"]}},
        _delete_todo,
    )

    use_api(
        {"api_path": "todo/:id", "http_method": "PUT", "description": "Update a todo", "metadata": {"tags": ["todo"]}},
        _update_todo,
    )

    use_api(
        {"api_path": "state", "http_method": "POST", "description": "Set application state"},
        _create_state,
    )

    use_api(
        {"api_path": "state/:id", "http_method": "GET", "description": "Get state by ID"},
        _get_state,
    )

    use_api(
        {
            "api_path": "http-fetch",
            "http_method": "GET",
            "description": "Fetch a todo from JSONPlaceholder (tests urllib instrumentation)",
        },
        _fetch_example,
    )

    use_api(
        {
            "api_path": "http-fetch",
            "http_method": "POST",
            "description": "Post data to httpbin (tests urllib instrumentation)",
        },
        _post_example,
    )


async def _create_todo(req: ApiRequest, ctx) -> ApiResponse:
    ctx.logger.info("Creating new todo", {"body": req.body})

    description = req.body.get("description") if req.body else None
    due_date = req.body.get("dueDate") if req.body else None
    todo_id = _generate_todo_id()

    if not description:
        return ApiResponse(statusCode=400, body={"error": "Description is required"})

    new_todo = {
        "id": todo_id,
        "description": description,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "dueDate": due_date,
        "completedAt": None,
    }
    todo = await streams.set("todo", "inbox", todo_id, new_todo)
    return ApiResponse(statusCode=201, body=todo, headers={"Content-Type": "application/json"})


async def _delete_todo(req: ApiRequest, ctx) -> ApiResponse:
    todo_id = req.body.get("todoId") if req.body else None

    ctx.logger.info("Deleting todo", {"body": req.body})

    if not todo_id:
        ctx.logger.error("todoId is required")
        return ApiResponse(statusCode=400, body={"error": "todoId is required"})

    await streams.delete("todo", "inbox", todo_id)

    ctx.logger.info("Todo deleted successfully", {"todoId": todo_id})
    return ApiResponse(statusCode=200, body={"success": True}, headers={"Content-Type": "application/json"})


async def _update_todo(req: ApiRequest, ctx) -> ApiResponse:
    todo_id = req.path_params.get("id")
    existing_todo = await streams.get("todo", "inbox", todo_id) if todo_id else None

    ctx.logger.info("Updating todo", {"body": req.body, "todoId": todo_id})

    if not existing_todo:
        ctx.logger.error("Todo not found")
        return ApiResponse(statusCode=404, body={"error": "Todo not found"})

    merged = {**existing_todo, **(req.body or {})}
    todo = await streams.set("todo", "inbox", todo_id, merged)

    ctx.logger.info("Todo updated successfully", {"todoId": todo_id})
    return ApiResponse(statusCode=200, body=todo, headers={"Content-Type": "application/json"})


async def _create_state(req: ApiRequest, ctx) -> ApiResponse:
    ctx.logger.info("Creating new todo", {"body": req.body})

    description = req.body.get("description") if req.body else None
    due_date = req.body.get("dueDate") if req.body else None
    todo_id = _generate_todo_id()

    if not description:
        return ApiResponse(statusCode=400, body={"error": "Description is required"})

    new_todo = {
        "id": todo_id,
        "description": description,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "dueDate": due_date,
        "completedAt": None,
    }
    todo = await state.set("todo", todo_id, new_todo)
    return ApiResponse(statusCode=201, body=todo, headers={"Content-Type": "application/json"})


async def _get_state(req: ApiRequest, ctx) -> ApiResponse:
    ctx.logger.info("Getting todo", req.path_params)

    todo_id = req.path_params.get("id")
    todo = await state.get("todo", todo_id)
    return ApiResponse(statusCode=200, body=todo, headers={"Content-Type": "application/json"})


async def _fetch_example(req: ApiRequest, ctx) -> ApiResponse:
    ctx.logger.info("Fetching todo from JSONPlaceholder")
    with urllib.request.urlopen("https://jsonplaceholder.typicode.com/todos/1") as response:
        data = json.loads(response.read().decode())
    return ApiResponse(statusCode=200, body=data, headers={"Content-Type": "application/json"})


async def _post_example(req: ApiRequest, ctx) -> ApiResponse:
    ctx.logger.info("Posting to httpbin", {"body": req.body})
    payload = json.dumps(req.body or {}).encode()
    post_req = urllib.request.Request(
        "https://httpbin.org/post",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(post_req) as response:
        data = json.loads(response.read().decode())
    return ApiResponse(statusCode=200, body=data, headers={"Content-Type": "application/json"})


async def _async_main() -> None:
    from .iii import init_iii

    init_iii()
    _setup()

    while True:
        await asyncio.sleep(60)


def main() -> None:
    asyncio.run(_async_main())


if __name__ == "__main__":
    main()
