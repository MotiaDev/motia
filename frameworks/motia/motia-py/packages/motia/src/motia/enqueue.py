"""Standalone enqueue function for Motia framework."""

from typing import Any

from .iii import get_instance
from .tracing import operation_span


async def enqueue(event: dict[str, Any]) -> None:
    """Enqueue an event to a topic."""
    with operation_span("enqueue", **{"motia.step.name": ""}):
        await get_instance().call("enqueue", event)
