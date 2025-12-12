from datetime import datetime, timezone

config = {
    "type": "cron",
    "cron": "0 0 * * 1", # run once every Monday at midnight
    "name": "StateAuditJob",
    "description": "Checks the state for orders that are not complete and have a ship date in the past",
    "emits": ["notification"],
    "flows": ["basic-tutorial"],
}

async def handler(context):
    state_value = await context.state.get_group("orders_python")

    for item in state_value:
        # check if current date is after item.ship_date
        current_date = datetime.now(timezone.utc)
        ship_date = datetime.fromisoformat(item.get("shipDate", "").replace('Z', '+00:00'))

        if not item.get("complete", False) and current_date > ship_date:
            context.logger.warn("Order is not complete and ship date is past", {
                "order_id": item.get("id"),
                "ship_date": item.get("shipDate"),
                "complete": item.get("complete", False),
            })

            await context.emit({
                "topic": "notification",
                "data": {
                    "email": "test@test.com",
                    "template_id": "order-audit-warning",
                    "template_data": {
                        "order_id": item.get("id"),
                        "status": item.get("status"),
                        "ship_date": item.get("shipDate"),
                        "message": "Order is not complete and ship date is past",
                    },
                },
            })
