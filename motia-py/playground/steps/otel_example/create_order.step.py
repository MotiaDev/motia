"""Create Order Step - demonstrates automatic OTel tracing.

No tracing code is needed in the handler - it's all automatic.
Install: pip install motia[otel]
"""

import random
import string
from datetime import datetime
from typing import Any

from motia import ApiRequest, ApiResponse, FlowContext, Stream, api

order_stream: Stream[dict[str, Any]] = Stream("orders")

config = {
    "name": "CreateOrder",
    "description": "Create a new order - auto-instrumented with OTel",
    "flows": ["otel-example"],
    "triggers": [
        api("POST", "/orders"),
    ],
    "emits": ["order.created"],
}


async def handler(request: ApiRequest[dict[str, Any]], ctx: FlowContext[Any]) -> ApiResponse[Any]:
    ctx.logger.info("Creating new order", {"trace_id": ctx.trace_id})

    body = request.body or {}
    description = body.get("description")
    amount = body.get("amount", 0)

    if not description:
        return ApiResponse(status=400, body={"error": "Description is required"})

    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
    order_id = f"order-{int(datetime.now().timestamp() * 1000)}-{suffix}"

    new_order: dict[str, Any] = {
        "id": order_id,
        "description": description,
        "amount": amount,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "trace_id": ctx.trace_id,
    }

    await order_stream.set("pending", order_id, new_order)
    await ctx.emit({"topic": "order.created", "data": new_order})

    ctx.logger.info("Order created", {"order_id": order_id, "trace_id": ctx.trace_id})
    return ApiResponse(status=201, body=new_order)
