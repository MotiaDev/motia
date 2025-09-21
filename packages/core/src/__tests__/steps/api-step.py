
config = {
    "name": "api-step",
    "triggers": [{
        "type": "api",
        "path": "/test",
        "method": "POST"
    }],
    "emits": ["TEST_EVENT"],
    "path": "/test",
    "method": "POST"
}


async def handler(_, context):
    await context.emit({
        "data": {"test": "data"},
        "topic": "TEST_EVENT"
    })
    
    return {
        "status": 200,
        "body": {"traceId": context.trace_id}
    }
