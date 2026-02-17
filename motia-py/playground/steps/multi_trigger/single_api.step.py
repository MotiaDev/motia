"""Test single API trigger."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, http


config = {
    "name": "SingleApiTrigger",
    "description": "Test single API trigger",
    "triggers": [
        http("GET", "/test/single"),
    ],
    "enqueues": [],
}


async def handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    """Handle single API trigger."""
    ctx.logger.info("Single API trigger fired")
    return ApiResponse(status=200, body={"message": "Single API trigger works"})
