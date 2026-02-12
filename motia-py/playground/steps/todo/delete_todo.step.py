"""Delete Todo Step."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, Stream, api

todo_stream: Stream[dict[str, Any]] = Stream("todo")

config = {
    "name": "DeleteTodo",
    "description": "Delete a todo item",
    "flows": ["todo-app"],
    "triggers": [
        api("DELETE", "/todo"),
    ],
    "emits": [],
}


async def handler(request: ApiRequest[dict[str, Any]], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    """Handle delete todo request."""
    body = request.body or {}
    todo_id = body.get("todo_id")

    ctx.logger.info("Deleting todo", body)

    if not todo_id:
        ctx.logger.error("todo_id is required")
        return ApiResponse(status=400, body={"error": "todo_id is required"})

    await todo_stream.delete("inbox", todo_id)

    ctx.logger.info("Todo deleted successfully", {"todo_id": todo_id})

    return ApiResponse(status=200, body={"success": True})
