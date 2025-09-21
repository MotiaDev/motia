config = {
    "name": "Test Event",
    "triggers": [{
        "type": "event",
        "topic": "test"
    }],
    "emits": ["tested"],
    "input": None,  # No schema validation in Python version
    "flows": ["simple-python"]
}

async def handler(input, context):
    context.logger.info("this is a test", input)

    enriched = await context.state.get(context.trace_id, "enriched")

    await context.emit({
        "topic": "tested",
        "data": { 
            "message": "hello world",
            "enriched": enriched
        }
    })