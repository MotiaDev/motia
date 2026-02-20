"""List greetings API step."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, Stream, http

GREETINGS_GROUP_ID = "default"
greetings_stream: Stream[dict[str, Any]] = Stream("greetings")


config = {
    "name": "ListGreetings",
    "description": "List greetings stored in the stream",
    "triggers": [
        http("GET", "/greetings"),
    ],
    "enqueues": [],
}


async def handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[dict[str, Any]]:
    """Handle list greetings requests."""
    _ = request
    greetings = await greetings_stream.get_group(GREETINGS_GROUP_ID)
    ctx.logger.info("Greetings listed", {"count": len(greetings)})
    return ApiResponse(status=200, body={"greetings": greetings})
