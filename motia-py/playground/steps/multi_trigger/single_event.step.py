"""Test single event trigger."""

from typing import Any

from motia import FlowContext, queue


config = {
    "name": "SingleEventTrigger",
    "description": "Test single event trigger",
    "triggers": [
        queue("test.event"),
    ],
    "enqueues": ["test.processed"],
}


async def handler(input: Any, ctx: FlowContext[Any]) -> None:
    """Handle single event trigger."""
    ctx.logger.info("Single event trigger fired", {"data": input})
