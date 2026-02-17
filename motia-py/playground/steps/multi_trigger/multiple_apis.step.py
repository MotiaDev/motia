"""Test multiple API triggers."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, api


config = {
    "name": "MultipleApis",
    "description": "Test multiple API triggers",
    "triggers": [
        api("GET", "/test/api/1"),
        api("POST", "/test/api/2"),
        api("PUT", "/test/api/3"),
    ],
    "enqueues": [],
}


async def handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    """Handle multiple API triggers."""
    ctx.logger.info("Multiple APIs trigger fired", {"path": ctx.trigger.path, "method": ctx.trigger.method})
    return ApiResponse(status=200, body={"message": "Multiple APIs trigger works"})
