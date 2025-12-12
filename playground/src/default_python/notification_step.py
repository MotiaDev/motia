from pydantic import BaseModel
from typing import Dict, Any
import re

class InputSchema(BaseModel):
    template_id: str
    email: str
    template_data: Dict[str, Any]

config = {
    "type": "event",
    "name": "PythonNotification",
    "description": "Checks a state change",
    "flows": ["python-tutorial"],
    "subscribes": ["python-notification"],
    "emits": [],
    "input": InputSchema.model_json_schema(),
}

async def handler(input_data, context):
    email = input_data.get("email")
    template_id = input_data.get("template_id")
    template_data = input_data.get("template_data")
    
    redacted_email = re.sub(r'(?<=.{2}).(?=.*@)', '*', email)

    context.logger.info("Processing Notification", {
        "template_id": template_id,
        "template_data": template_data,
        "email": redacted_email,
    })

    # This represents a call to some sort of
    # notification service to indicate that a
    # new order has been placed
    context.logger.info("New notification sent", {
        "template_id": template_id,
        "email": redacted_email,
        "template_data": template_data,
    })
