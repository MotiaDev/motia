"""Test triple trigger (event + API + cron)."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, api, cron, queue


async def is_business_hours(input: Any, ctx: FlowContext[Any]) -> bool:
    """Check if current time is business hours."""
    _ = input
    _ = ctx
    from datetime import datetime

    now = datetime.now()
    return 9 <= now.hour < 17


config = {
    "name": "TripleTrigger",
    "description": "Test triple trigger (event + API + cron)",
    "triggers": [
        queue("test.triple"),
        api("POST", "/test/triple", condition=is_business_hours),
        cron("0 2 * * * *"),
    ],
    "emits": ["test.triple.processed"],
}


async def _event_handler(input: Any, ctx: FlowContext[Any]) -> None:
    """Handle triple trigger from event."""
    ctx.logger.info("Triple trigger fired (event)", {"data": input, "topic": ctx.trigger.topic})


async def _api_handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    """Handle triple trigger from API."""
    ctx.logger.info("Triple trigger fired (api)", {"path": ctx.trigger.path, "method": ctx.trigger.method})
    return ApiResponse(status=200, body={"message": "Triple trigger via API"})


async def _cron_handler(ctx: FlowContext[Any]) -> None:
    """Handle triple trigger from cron."""
    ctx.logger.info("Triple trigger fired (cron)", {"expression": ctx.trigger.expression})


async def handler(input_data: Any, ctx: FlowContext[Any]) -> Any:
    """Dispatch triple trigger handlers."""
    return await ctx.match(
        {
            "queue": _event_handler,
            "http": _api_handler,
            "cron": _cron_handler,
        },
    )
