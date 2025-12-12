import os
import random
import string
from datetime import datetime, timezone

# Optional: Using Pydantic for validation (remove if not using Pydantic)
try:
    from pydantic import BaseModel
    
    class HelloResponse(BaseModel):
        message: str
        status: str
        appName: str
    
    # If using Pydantic, we can generate the JSON schema
    response_schema = {
        200: HelloResponse.model_json_schema()
    }
except ImportError:
    # Without Pydantic, define JSON schema manually
    response_schema = {
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "status": {"type": "string"},
                "appName": {"type": "string"}
            },
            "required": ["message", "status", "appName"]
        }
    }

config = {
    "name": "HelloAPI",
    "type": "api",
    "path": "/hello",
    "method": "GET",
    "description": "Receives hello request and emits event for processing",
    "emits": ["process-greeting"],
    "flows": ["hello-world-flow"],
    "responseSchema": response_schema
}

async def handler(req, context):
    app_name = os.environ.get("APP_NAME", "Motia App")
    timestamp = datetime.now(timezone.utc).isoformat()
    
    context.logger.info("Hello API endpoint called", {
        "app_name": app_name,
        "timestamp": timestamp
    })
    
    # Generate a random request ID
    request_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))
    
    # Emit event for background processing
    await context.emit({
        "topic": "process-greeting",
        "data": {
            "timestamp": timestamp,
            "appName": app_name,
            "greetingPrefix": os.environ.get("GREETING_PREFIX", "Hello"),
            "requestId": request_id
        }
    })
    
    return {
        "status": 200,
        "body": {
            "message": "Hello request received! Check logs for processing.",
            "status": "processing",
            "appName": app_name
        }
    }
