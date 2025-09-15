config = {
    "type": "api" # missing comma, compilation error
    "name": "ApiTrigger",
    "description": "basic-tutorial api trigger",
    "flows": ["basic-tutorial"],
    "method": "POST",
    "path": "/",
    "emits": [],
}

async def handler(req, context):
    return {"status": 200, "body": {}}