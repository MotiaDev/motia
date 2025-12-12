config = {
    "type": "event",
    "name": "Tested Event",
    "subscribes": ["tested"],
    "emits": [],
    "input": None,
    "flows": ["simple-python"]
}

async def handler(input, context):
    context.logger.info("event has been received", input)
    message = await context.state.get(context.trace_id, "message")
    context.logger.info("State requested", {"message": message })
