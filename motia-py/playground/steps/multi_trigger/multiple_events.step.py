"""Test multiple event triggers."""

from typing import Any

from motia import FlowContext, event


config = {
    "name": "MultipleEvents",
    "description": "Test multiple event triggers",
    "triggers": [
        event("test.event.1"),
        event("test.event.2"),
        event("test.event.3"),
    ],
    "emits": ["test.events.processed"],
}


async def handler(input: Any, ctx: FlowContext[Any]) -> None:
    """Handle multiple event triggers."""
    ctx.logger.info("Multiple events trigger fired", {"data": input, "topic": ctx.trigger.topic})
