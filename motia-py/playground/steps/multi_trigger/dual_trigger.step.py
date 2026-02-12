"""Test dual trigger (event + API)."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, api, event


config = {
    "name": "DualTrigger",
    "description": "Test dual trigger (event + API)",
    "triggers": [
        event("test.dual"),
        api("POST", "/test/dual"),
    ],
    "emits": ["test.dual.processed"],
}


async def _event_handler(input: Any, ctx: FlowContext[Any]) -> None:
    """Handle dual trigger from event."""
    ctx.logger.info("Dual trigger fired (event)", {"data": input, "topic": ctx.trigger.topic})


async def _api_handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    """Handle dual trigger from API."""
    ctx.logger.info("Dual trigger fired (api)", {"path": ctx.trigger.path, "method": ctx.trigger.method})
    return ApiResponse(status=200, body={"message": "Dual trigger via API"})


async def handler(input_data: Any, ctx: FlowContext[Any]) -> Any:
    """Dispatch dual trigger handlers."""
    return await ctx.match(
        {
            "event": _event_handler,
            "api": _api_handler,
        },
    )
