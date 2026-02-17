"""Test dual trigger (event + API)."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, api, queue


config = {
    "name": "DualTrigger",
    "description": "Test dual trigger (event + API)",
    "triggers": [
        queue("test.dual"),
        api("POST", "/test/dual"),
    ],
    "enqueues": ["test.dual.processed"],
}


async def handler(input_data: Any, ctx: FlowContext[Any]) -> Any:
    """Dispatch dual trigger handlers."""

    async def _event_handler(input: Any) -> None:
        ctx.logger.info("Dual trigger fired (queue)", {"data": input, "topic": ctx.trigger.topic})

    async def _api_handler(request: ApiRequest[Any]) -> ApiResponse[Any]:
        ctx.logger.info("Dual trigger fired (api)", {"path": ctx.trigger.path, "method": ctx.trigger.method})
        return ApiResponse(status=200, body={"message": "Dual trigger via API"})

    return await ctx.match(
        {
            "queue": _event_handler,
            "http": _api_handler,
        },
    )
