from pydantic import BaseModel
from typing import Optional
from ..python.repo import Repo

class PetRequest(BaseModel):
    name: str
    photo_url: str

class FoodOrder(BaseModel):
    id: str
    quantity: int

class RequestBody(BaseModel):
    pet: PetRequest
    food_order: Optional[FoodOrder] = None

config = {
    "type": "api",
    "name": "PythonApiTrigger2",
    "description": "basic-tutorial api trigger",
    "flows": ["python-tutorial"],
    "method": "POST",
    "path": "/python-basic-tutorial2",
    "bodySchema": RequestBody.model_json_schema(),
    "emits": [],
}

async def handler(req, context):
    body = req.get("body", {})
    context.logger.info("Step 01 – Processing API Step", {"body": body})

    repo = Repo()
    context.logger.info("Repo", {"repo": repo.say_hello()})

    return {"status": 200, "body": {"traceId": context.trace_id}}