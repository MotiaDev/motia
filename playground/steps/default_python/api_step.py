from pydantic import BaseModel
from typing import Optional
from .services.pet_store import pet_store_service
from .services.types import Pet

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
    "name": "PythonApiTrigger",
    "description": "basic-tutorial api trigger",
    "flows": ["python-tutorial"],
    "triggers": [{
        "type": "api",
        "path": "/python-basic-tutorial",
        "method": "POST"
    }],
    "method": "POST",
    "path": "/python-basic-tutorial",
    "input": RequestBody.model_json_schema(),
    "responseSchema": {
        200: Pet.model_json_schema(),
    },
    "emits": ["python-process-food-order"],
}

async def handler(req, context):
    body = req.get("body", {})
    context.logger.info("Step 01 – Processing API Step", {"body": body})

    pet = body.get("pet", {})
    food_order = body.get("food_order", {})
    
    new_pet_record = await pet_store_service.create_pet(pet)

    if food_order:
        await context.emit({
            "topic": "python-process-food-order",
            "data": {
                "id": food_order.get("id"),
                "quantity": food_order.get("quantity"),
                "email": "test@test.com",  # sample email
                "pet_id": new_pet_record.get("id"),
            },
        })

    return {"status": 200, "body": {**new_pet_record, "traceId": context.trace_id}}
