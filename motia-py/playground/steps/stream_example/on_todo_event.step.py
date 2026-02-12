"""Step that reacts to stream events."""
from typing import Any
from motia import FlowContext, stream, StreamTriggerInput


config = {
    "name": "on-todo-stream-event",
    "description": "React to todo stream events",
    "triggers": [
        stream("todo"),
    ],
    "emits": ["todo.processed"],
    "flows": ["stream-example"],
}


async def handler(input: StreamTriggerInput, ctx: FlowContext[Any]) -> None:
    """Handle todo stream event."""
    ctx.logger.info(
        f"Todo stream event",
        {
            "stream_name": input.stream_name,
            "group_id": input.group_id,
            "item_id": input.id,
            "event_type": input.event.type,
            "data": input.event.data,
        },
    )

    # Process based on event type
    if input.event.type == "create":
        ctx.logger.info(f"New todo created: {input.id}")
    elif input.event.type == "update":
        ctx.logger.info(f"Todo updated: {input.id}")
    elif input.event.type == "delete":
        ctx.logger.info(f"Todo deleted: {input.id}")

    await ctx.emit({
        "topic": "todo.processed",
        "data": {
            "todo_id": input.id,
            "event_type": input.event.type,
        },
    })
