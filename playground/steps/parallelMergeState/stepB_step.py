import time

# Python equivalent of zod schema validation would need to be implemented
# For now using simple dict for config

config = {
    "type": "event",
    "name": "stepB", 
    "description": "Hello from Step B",
    "subscribes": ["pms.start"],
    "emits": ["pms.stepB.done"],
    "flows": ["parallel-merge"]
}

async def handler(_, context):
    context.logger.info("[stepB] received pms.start")

    partial_result_b = {
        "msg": "Hello from Step B",
        "timestamp": int(time.time() * 1000)  # Current timestamp in ms
    }

    context.logger.info("[stepB] setting state")
    await context.state.set(context.trace_id, "stepB", partial_result_b)
    context.logger.info("[stepB] state set")

    await context.emit({
        "topic": "pms.stepB.done",
        "data": partial_result_b
    })

    context.logger.info("[stepB] done")