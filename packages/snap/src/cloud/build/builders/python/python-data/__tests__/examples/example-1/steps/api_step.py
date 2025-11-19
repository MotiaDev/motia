from ..src.pet_store import pet_store_service
from ..src.types import Pet

config = {
    "type": "api",
    "name": "ApiTrigger",
    "description": "basic-tutorial api trigger",
    "flows": ["basic-tutorial"],
    "method": "POST",
    "path": "/",
    "bodySchema": {
        "type": "object",
        "properties": {
            "pet": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "photoUrl": {"type": "string"}
                },
                "required": ["name", "photoUrl"]
            },
            "foodOrder": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "quantity": {"type": "number"}
                },
                "required": ["id", "quantity"]
            }
        },
        "required": ["pet"]
    },
    "responseSchema": {
        200: Pet.model_json_schema(),
    },
    "emits": [],
}

async def handler(req, context):
    body = req.get("body", {})
    context.logger.info("Step 01 - Processing API Step", {"body": body})

    pet = body.get("pet", {})
    food_order = body.get("foodOrder", {})
    
    new_pet_record = await pet_store_service.create_pet(pet)

    return {"status": 200, "body": {**new_pet_record, "traceId": context.trace_id}}