"""Greetings summary step for API and cron."""

from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, Stream, api, cron

GREETINGS_GROUP_ID = "default"
greetings_stream: Stream[dict[str, Any]] = Stream("greetings")


config = {
    "name": "GreetingsSummary",
    "description": "Summarize greetings via API or every 5 seconds",
    "triggers": [
        api("GET", "/greetings/summary"),
        cron("*/5 * * * * *"),
    ],
    "emits": [],
}


async def _summary_api_handler(request: ApiRequest[Any], ctx: FlowContext[Any]) -> ApiResponse[dict[str, Any]]:
    """Handle summary requests from the API."""
    _ = request
    greetings = await greetings_stream.get_group(GREETINGS_GROUP_ID)
    ctx.logger.info("Greetings summary requested", {"count": len(greetings)})
    return ApiResponse(status=200, body={"count": len(greetings), "greetings": greetings})


async def _summary_cron_handler(ctx: FlowContext[Any]) -> None:
    """Handle summary logging from the cron trigger."""
    greetings = await greetings_stream.get_group(GREETINGS_GROUP_ID)
    ctx.logger.info("Greetings summary (cron)", {"count": len(greetings)})


async def handler(input_data: Any, ctx: FlowContext[Any]) -> Any:
    """Dispatch to the API or cron handler based on trigger type."""
    return await ctx.match(
        {
            "api": _summary_api_handler,
            "cron": _summary_cron_handler,
        },
    )
