import time

config = {
    "type": "event",
    "name": "stepC", 
    "description": "Hello from Step C",
    "subscribes": ["pms.start"],
    "emits": ["pms.stepC.done"],
    "flows": ["parallel-merge"]
}

async def handler(_, context):
    context.logger.info("[stepC] received pms.start")

    partial_result_c = {
        "msg": "Hello from Step C",
        "timestamp": int(time.time() * 1000)  # Current timestamp in ms
    }

    context.logger.info("[stepC] setting state")
    await context.state.set(context.trace_id, "stepC", partial_result_c)
    context.logger.info("[stepC] state set")

    await context.emit({
        "topic": "pms.stepC.done",
        "data": partial_result_c
    })

    context.logger.info("[stepC] done") 