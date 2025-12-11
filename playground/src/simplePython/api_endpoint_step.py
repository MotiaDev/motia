async def enrich_data(req, ctx, next_fn):
    try:
        ctx.logger.info("enriching data")
        req["enriched"] = "yes"
        return await next_fn()
    except Exception as error:
        ctx.logger.error('Error in handler', {'error': str(error)})
        return {
            'status': 500,
            'body': {'error': 'Internal server error'}
        }

config = {
    "type": "api",
    "name": "Test API Endpoint",
    "emits": ["test"],
    "flows": ["simple-python"],

    "path": "/test-python",
    "method": "POST",

    "middleware": [
        enrich_data
    ]
}

async def handler(req, context):
    if req.get("enriched") == "yes":
        await context.state.set(context.trace_id, "enriched", "yes")
        context.logger.info("enriched is yes")  
    else:
        await context.state.set(context.trace_id, "enriched", "no")
        context.logger.error("enriched is not yes")

    context.logger.info("this is a test", { "body": req.get("body"), "req": req })

    await context.emit({ "topic": "test", "data": req.get("body") })
    await context.state.set(context.trace_id, "message", "hello world")

    context.logger.info("State set", { "message": "hello world" })

    return {
        "status": 200,
        "body": { "message": "payload processed" }
    }
