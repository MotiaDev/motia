"""Delete greeting API step."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, Stream, http

GREETINGS_GROUP_ID = "default"
greetings_stream: Stream[dict[str, Any]] = Stream("greetings")


config = {
    "name": "DeleteGreeting",
    "description": "Delete a greeting from the stream",
    "triggers": [
        http("DELETE", "/greetings/:name"),
    ],
    "enqueues": [],
}


async def handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    """Handle delete greeting requests."""
    name = request.path_params.get("name")
    if not name:
        return ApiResponse(status=400, body={"error": "missing name"})

    await greetings_stream.delete(GREETINGS_GROUP_ID, name)
    ctx.logger.info("Greeting deleted", {"name": name})

    return ApiResponse(status=204, body="")
