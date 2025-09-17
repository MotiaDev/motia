## This import is invalid because there's no dependency in requirements.txt
from openai import OpenAI

config = {
    "type": "api",
    "name": "ApiTrigger",
    "description": "basic-tutorial api trigger",
    "flows": ["basic-tutorial"],
    "method": "POST",
    "path": "/",
    "emits": [],
}

async def handler(req, context):
    return {"status": 200, "body": {}}