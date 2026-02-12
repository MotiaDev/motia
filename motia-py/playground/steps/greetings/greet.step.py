"""Greeting API step."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, Stream, api

GREETINGS_GROUP_ID = "default"
greetings_stream: Stream[dict[str, Any]] = Stream("greetings")


def _first_param(value: str | list[str] | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, list):
        return value[0] if value else None
    return value


config = {
    "name": "Greet",
    "description": "Greet and store the greeting in a stream",
    "triggers": [
        api("GET", "/greet"),
    ],
    "emits": [],
}


async def handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[dict[str, Any]]:
    """Handle greeting requests."""
    name = _first_param(request.query_params.get("name")) or "world"
    greeting = {"name": name, "message": f"Hello, {name}!"}

    await greetings_stream.set(GREETINGS_GROUP_ID, name, greeting)
    ctx.logger.info("Greeting stored", {"name": name})

    return ApiResponse(status=200, body=greeting)
