"""Test triple trigger (event + API + cron)."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, cron, http, queue


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
        http("POST", "/test/triple", condition=is_business_hours),
        cron("0 2 * * * *"),
    ],
    "enqueues": ["test.triple.processed"],
}


async def handler(input_data: Any, ctx: FlowContext[Any]) -> Any:
    """Dispatch triple trigger handlers."""

    async def _event_handler(input: Any) -> None:
        ctx.logger.info("Triple trigger fired (queue)", {"data": input, "topic": ctx.trigger.topic})

    async def _api_handler(request: ApiRequest[Any]) -> ApiResponse[Any]:
        ctx.logger.info("Triple trigger fired (api)", {"path": ctx.trigger.path, "method": ctx.trigger.method})
        return ApiResponse(status=200, body={"message": "Triple trigger via API"})

    async def _cron_handler() -> None:
        ctx.logger.info("Triple trigger fired (cron)", {"expression": ctx.trigger.expression})

    return await ctx.match(
        {
            "queue": _event_handler,
            "http": _api_handler,
            "cron": _cron_handler,
        },
    )
