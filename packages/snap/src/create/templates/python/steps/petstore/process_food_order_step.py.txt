from pydantic import BaseModel
from datetime import datetime, timezone
from src.services.pet_store import pet_store_service

class InputSchema(BaseModel):
    email: str
    quantity: int
    pet_id: str

config = {
    "type": "event",
    "name": "ProcessFoodOrder",
    "description": "basic-tutorial event step, demonstrates how to consume an event from a topic and persist data in state",
    "flows": ["basic-tutorial"],
    "subscribes": ["process-food-order"],
    "emits": ["notification"],
    "input": InputSchema.model_json_schema(),
}

async def handler(input_data, context):
    context.logger.info("Step 02 - Process food order", {"input": input_data, "traceId": context.trace_id})

    order = await pet_store_service.create_order({
        "quantity": input_data.get("quantity"),
        "pet_id": input_data.get("pet_id"),
        "email": input_data.get("email"),
        "ship_date": datetime.now(timezone.utc).isoformat(),
        "status": "placed",
    })

    context.logger.info("Order created", {"order": order})

    await context.state.set("orders_python", order.get("id"), order)

    await context.emit({
        "topic": "notification",
        "data": {
            "email": input_data["email"],
            "template_id": "new-order",
            "template_data": {
                "status": order.get("status"),
                "ship_date": order.get("shipDate"),
                "id": order.get("id"),
                "pet_id": order.get("petId"),
                "quantity": order.get("quantity"),
            },
        },
    })
