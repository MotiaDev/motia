---
title: State Management
description: Persistent Key-Value storage that works across Triggers, Steps, and Functions
---

import VideoPlayer from '@/components/VideoPlayer';

<VideoPlayer videoPath="https://assets.motia.dev/videos/mp4/site/v1/6-motia-state.mp4" gifPath="https://assets.motia.dev/images/gifs/v1/6-motia-state.gif" title="State Management" className="mb-8" />

State is persistent key-value storage that works across all your Triggers, Steps, and Functions. Set data in one Trigger, read it in another. Works across TypeScript, Python, and JavaScript.

## How It Works

State organizes data into **groups**. Each group can hold multiple items with unique keys.

Think of it like folders and files:
- **groupId** = A folder name (like `orders`, `users`, `cache`)
- **key** = A file name inside that folder
- **value** = The actual data

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'MyStep',
  description: 'Demonstrates state usage',
  triggers: [
    { type: 'queue', topic: 'my-topic' },
  ],
  flows: ['my-flow'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state }) => {
  // Store an item in a group (returns { new_value, old_value })
  const result = await state.set('orders', 'order-123', {
    id: 'order-123',
    status: 'pending',
    total: 99.99
  })

  // Get a specific item
  const order = await state.get('orders', 'order-123')

  // Get all items in a group
  const allOrders = await state.getGroup('orders')

  // Delete a specific item
  await state.delete('orders', 'order-123')

  // Clear entire group
  await state.clear('orders')
}
```

</Tab>
<Tab value='Python'>

```python
async def handler(input, context):
    # Store an item in a group (returns { new_value, old_value })
    result = await context.state.set("orders", "order-123", {
        "id": "order-123",
        "status": "pending",
        "total": 99.99
    })

    # Get a specific item
    order = await context.state.get("orders", "order-123")

    # Get all items in a group
    all_orders = await context.state.get_group("orders")

    # Delete a specific item
    await context.state.delete("orders", "order-123")

    # Clear entire group
    await context.state.clear("orders")
  ```

  </Tab>
<Tab value='JavaScript'>

  ```javascript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'MyStep',
  description: 'Demonstrates state usage',
  triggers: [
    { type: 'queue', topic: 'my-topic' },
  ],
  flows: ['my-flow'],
}

const handler = async (input, { state }) => {
  // Store an item in a group (returns { new_value, old_value })
  const result = await state.set('orders', 'order-123', {
    id: 'order-123',
    status: 'pending',
    total: 99.99
  })

  // Get a specific item
  const order = await state.get('orders', 'order-123')

  // Get all items in a group
  const allOrders = await state.getGroup('orders')

  // Delete a specific item
  await state.delete('orders', 'order-123')

  // Clear entire group
  await state.clear('orders')
  }
  ```

  </Tab>
</Tabs>

---

## State Methods

| Method | What it does |
|--------|--------------|
| `state.set(groupId, key, value)` | Store an item in a group. Returns `StreamSetResult` with `new_value` and `old_value` |
| `state.get(groupId, key)` | Get a specific item (returns `null` if not found) |
| `state.getGroup(groupId)` | Get all items in a group as an array |
| `state.delete(groupId, key)` | Remove a specific item |
| `state.clear(groupId)` | Remove all items in a group |
| `state.update(groupId, key, ops)` | Atomic update with `UpdateOp[]` |

---

## Atomic Updates

Use `state.update()` for atomic operations on state items. This is useful when you need to increment counters, update specific fields, or perform multiple changes atomically.

```typescript
import { type Handlers, type StepConfig, type UpdateOp } from 'motia'

export const config = {
  name: 'UpdateInventory',
  description: 'Atomically update inventory',
  triggers: [
    { type: 'queue', topic: 'inventory.update' },
  ],
  flows: ['inventory'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state }) => {
  const ops: UpdateOp[] = [
    { type: 'set', path: 'name', value: 'New Name' },
    { type: 'increment', path: 'count', by: 1 },
    { type: 'decrement', path: 'stock', by: 1 },
  ]
  const result = await state.update('inventory', 'item-123', ops)
  // result has new_value and old_value
}
```

### Available Update Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| `set` | Set a field to a value | `{ type: 'set', path: 'name', value: 'New Name' }` |
| `increment` | Increment a numeric field | `{ type: 'increment', path: 'count', by: 1 }` |
| `decrement` | Decrement a numeric field | `{ type: 'decrement', path: 'stock', by: 1 }` |

---

## Real-World Example

Let's build an order processing workflow that uses state across multiple Steps.

**Step 1 - API receives order:**

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'CreateOrder',
  description: 'Receive and store a new order',
  triggers: [
    { type: 'api', path: '/orders', method: 'POST' },
  ],
  enqueues: ['order.created'],
  flows: ['order-processing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, { state, enqueue, logger }) => {
  const orderId = crypto.randomUUID()

  const order = {
    id: orderId,
    items: req.body.items,
    total: req.body.total,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  // Store in state
  await state.set('orders', orderId, order)

  logger.info('Order created', { orderId })

  // Trigger processing
  await enqueue({
    topic: 'order.created',
    data: { orderId }
  })

  return { status: 201, body: order }
}
```

  </Tab>
<Tab value='Python'>

```python
import uuid
from datetime import datetime

async def handler(req, context):
    order_id = str(uuid.uuid4())

    order = {
        "id": order_id,
        "items": req.get("body", {}).get("items"),
        "total": req.get("body", {}).get("total"),
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }

    # Store in state
    await context.state.set("orders", order_id, order)

    context.logger.info("Order created", {"orderId": order_id})

    # Trigger processing
    await context.enqueue({
        "topic": "order.created",
        "data": {"orderId": order_id}
    })

    return {"status": 201, "body": order}
  ```

  </Tab>
<Tab value='JavaScript'>

  ```javascript
const handler = async (req, { state, enqueue, logger }) => {
  const orderId = crypto.randomUUID()

  const order = {
    id: orderId,
    items: req.body.items,
    total: req.body.total,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  // Store in state
  await state.set('orders', orderId, order)

  logger.info('Order created', { orderId })

  // Trigger processing
  await enqueue({
    topic: 'order.created',
    data: { orderId }
  })

  return { status: 201, body: order }
}
  ```

  </Tab>
</Tabs>

**Step 2 - Process payment:**

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

  ```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'ProcessPayment',
  description: 'Process payment for an order',
  triggers: [
    { type: 'queue', topic: 'order.created' },
  ],
  enqueues: ['payment.completed'],
  flows: ['order-processing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, enqueue, logger }) => {
  const { orderId } = input

  // Get order from state
  const order = await state.get('orders', orderId)

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  // Update status
  order.status = 'paid'
  await state.set('orders', orderId, order)

  logger.info('Payment processed', { orderId })

  await enqueue({
    topic: 'payment.completed',
    data: { orderId }
  })
}
  ```

  </Tab>
<Tab value='Python'>

```python
async def handler(input, context):
    order_id = input.get("orderId")

    # Get order from state
    order = await context.state.get("orders", order_id)

    if not order:
        raise Exception(f"Order {order_id} not found")

    # Update status
    order["status"] = "paid"
    await context.state.set("orders", order_id, order)

    context.logger.info("Payment processed", {"orderId": order_id})

    await context.enqueue({
        "topic": "payment.completed",
        "data": {"orderId": order_id}
    })
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (input, { state, enqueue, logger }) => {
  const { orderId } = input

  // Get order from state
  const order = await state.get('orders', orderId)

  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  // Update status
  order.status = 'paid'
  await state.set('orders', orderId, order)

  logger.info('Payment processed', { orderId })

  await enqueue({
    topic: 'payment.completed',
    data: { orderId }
  })
}
  ```

  </Tab>
</Tabs>

**Step 3 - View all orders (Cron job):**

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

  ```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'DailyReport',
  description: 'Generate daily order report',
  triggers: [
    { type: 'cron', pattern: '0 0 * * *' },
  ],
  flows: ['order-processing'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { state, logger }) => {
  // Get all orders
  const allOrders = await state.getGroup<Order>('orders')

  const pending = allOrders.filter(o => o.status === 'pending')
  const paid = allOrders.filter(o => o.status === 'paid')

  logger.info('Daily order report', {
    total: allOrders.length,
    pending: pending.length,
    paid: paid.length
  })
}
```

  </Tab>
<Tab value='Python'>

```python
async def handler(context):
    # Get all orders
    all_orders = await context.state.get_group("orders")

    pending = [o for o in all_orders if o.get("status") == "pending"]
    paid = [o for o in all_orders if o.get("status") == "paid"]

    context.logger.info("Daily order report", {
        "total": len(all_orders),
        "pending": len(pending),
        "paid": len(paid)
    })
```

</Tab>
<Tab value='JavaScript'>

  ```javascript
const handler = async (input, { state, logger }) => {
  // Get all orders
  const allOrders = await state.getGroup('orders')

  const pending = allOrders.filter(o => o.status === 'pending')
  const paid = allOrders.filter(o => o.status === 'paid')

  logger.info('Daily order report', {
    total: allOrders.length,
    pending: pending.length,
    paid: paid.length
  })
}
```

  </Tab>
</Tabs>

---

## When to Use State

**Good use cases:**
- **Temporary workflow data** - Data that's only needed during a flow execution
- **API response caching** - Cache expensive API calls that don't change often
- **Sharing data between Steps** - Pass data between Steps without enqueuing it in events
- **Building up results** - Accumulate data across multiple Steps

**Better alternatives:**
- **Persistent user data** - Use a database like Postgres or MongoDB
- **File storage** - Use S3 or similar for images, PDFs, documents
- **Real-time updates** - Use Motia Streams for live data to clients
- **Large datasets** - Use a proper database, not state

---

## Remember

- Organize data using **groupId** (like `orders`, `users`, `cache`)
- Each item needs a unique **key** within its groupId
- Use `getGroup(groupId)` to retrieve all items in a group
- `state.set()` returns `{ new_value, old_value }` (StreamSetResult)
- Use `state.update()` for atomic operations like increment/decrement
- State works the same across TypeScript, Python, and JavaScript
- Clean up state when you're done with it
- Use databases for permanent data, state for temporary workflow data

---
