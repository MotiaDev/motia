"""Test single event trigger."""

from typing import Any

from motia import FlowContext, event


config = {
    "name": "SingleEventTrigger",
    "description": "Test single event trigger",
    "triggers": [
        event("test.event"),
    ],
    "emits": ["test.processed"],
}


async def handler(input: Any, ctx: FlowContext[Any]) -> None:
    """Handle single event trigger."""
    ctx.logger.info("Single event trigger fired", {"data": input})
