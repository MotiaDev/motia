"""Test single cron trigger."""

from typing import Any

from motia import FlowContext, cron

config = {
    "name": "SingleCronTrigger",
    "description": "Test single cron trigger",
    "triggers": [
        cron("5 * * * * *"),
    ],
    "enqueues": [],
}


async def handler(input: None, ctx: FlowContext[Any]) -> None:
    """Handle single cron trigger."""
    _ = input
    ctx.logger.info("Single cron trigger fired")
