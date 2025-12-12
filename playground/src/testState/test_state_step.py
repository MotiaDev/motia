config = {
    "type": "event",
    "name": "Test State With Python",
    "subscribes": ["test-state-python"],
    "emits": ["test-state-check"],
    "input": {
        "key": { "type": "string" },
        "expected": { "type": "string" },
    },
    "flows": ["test-state"]
}

async def handler(args, ctx):
    ctx.logger.info('[Test motia state with python] received test-state event', args)
    
    value = {"state": {"with": {"nested": {"value": 1}}}}
    
    ctx.logger.info('[Test motia state with python] setting state value', value)
    
    await ctx.state.set(ctx.trace_id, 'python_state', value)

    await ctx.emit({
        "topic": "test-state-check",
        "data": { 
            "key": "python_state", 
            "expected": value 
        },
    })
