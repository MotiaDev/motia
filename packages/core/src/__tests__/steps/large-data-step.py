config = {
    "type": "api",
    "name": "large-data-step-python",
    "emits": [],
    "path": "/large-python",
    "method": "POST",
}


async def handler(data, context):
    if isinstance(data, str):
        return len(data)
    try:
        import json
        return len(json.dumps(data))
    except Exception:
        return 0

