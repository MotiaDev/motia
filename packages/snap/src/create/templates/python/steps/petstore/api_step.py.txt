from pydantic import BaseModel
from typing import Optional
from src.services.pet_store import pet_store_service
from src.services.types import Pet

class PetRequest(BaseModel):
    name: str
    photoUrl: str

class FoodOrder(BaseModel):
    quantity: int

class RequestBody(BaseModel):
    pet: PetRequest
    foodOrder: Optional[FoodOrder] = None

config = {
    "type": "api",
    "name": "ApiTrigger",
    "description": "basic-tutorial api trigger",
    "flows": ["basic-tutorial"],
    "method": "POST",
    "path": "/basic-tutorial",
    "bodySchema": RequestBody.model_json_schema(),
    "responseSchema": {
        200: Pet.model_json_schema(),
    },
    "emits": ["process-food-order"],
}

async def handler(req, context):
    body = req.get("body", {})
    context.logger.info("Step 01 - Processing API Step", {"body": body})

    pet = body.get("pet", {})
    food_order = body.get("foodOrder", {})
    
    new_pet_record = await pet_store_service.create_pet(pet)

    if food_order:
        await context.emit({
            "topic": "process-food-order",
            "data": {
                "quantity": food_order.get("quantity"),
                "email": "test@test.com",  # sample email
                "pet_id": new_pet_record.get("id"),
            },
        })

    return {"status": 200, "body": {**new_pet_record, "traceId": context.trace_id}}
