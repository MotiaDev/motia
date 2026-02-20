"""Step that creates todos in a stream."""

import uuid
from typing import Any

from motia import FlowContext, Stream, http

todo_stream: Stream[dict[str, Any]] = Stream("todo")

config = {
    "name": "create-todo",
    "description": "API endpoint to create a todo item",
    "triggers": [
        http(
            "POST",
            "/todos",
            body_schema={
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "group_id": {"type": "string"},
                },
            },
        ),
    ],
    "flows": ["stream-example"],
}


async def handler(request: Any, ctx: FlowContext[Any]) -> dict[str, Any]:
    """Create a new todo item."""
    todo_id = str(uuid.uuid4())
    body = request.body or {}
    description = body.get("description", "New todo")
    group_id = body.get("group_id", "inbox")

    todo = {
        "id": todo_id,
        "description": description,
        "completed": False,
    }

    # Set in stream - this will trigger stream listeners
    await todo_stream.set(group_id, todo_id, todo)

    ctx.logger.info(f"Created todo {todo_id} in group {group_id}")

    return {
        "status": 201,
        "body": todo,
    }
