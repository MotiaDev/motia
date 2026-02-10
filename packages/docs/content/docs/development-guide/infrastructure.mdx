---
title: Infrastructure
description: Configure queue behavior, retries, and timeouts for Queue Steps
---

Infrastructure settings let you control how Queue Steps handle queues, retries, and timeouts. Motia provides sensible defaults, so you only configure what you need.

## How It Works

Add `infrastructure` to your Step config that uses a queue trigger:

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'SendEmail',
  description: 'Send email with retry support',
  triggers: [
    { type: 'queue', topic: 'email.requested' },
  ],
  infrastructure: {
    handler: { timeout: 10 },
    queue: { maxRetries: 5, visibilityTimeout: 60 }
  },
  flows: ['notifications'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "SendEmail",
    "description": "Send email with retry support",
    "triggers": [
        {"type": "queue", "topic": "email.requested"}
    ],
    "infrastructure": {
        "handler": {"timeout": 10},
        "queue": {"maxRetries": 5, "visibilityTimeout": 60}
    },
    "flows": ["notifications"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'SendEmail',
  description: 'Send email with retry support',
  triggers: [
    { type: 'queue', topic: 'email.requested' },
  ],
  infrastructure: {
    handler: { timeout: 10 },
    queue: { maxRetries: 5, visibilityTimeout: 60 }
  },
  flows: ['notifications']
}
```

</Tab>
</Tabs>

---

## Configuration Options

### Handler Settings

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timeout` | `number` | 30 | Handler timeout in seconds |

### Queue Settings

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `string` | `standard` | Queue type: `standard` or `fifo` |
| `maxRetries` | `number` | 3 | Number of retry attempts on failure |
| `visibilityTimeout` | `number` | 900 | Seconds before message becomes visible again |
| `delaySeconds` | `number` | 0 | Delay before processing (0-900 seconds) |

---

## FIFO Queues

FIFO queues guarantee exactly-once processing and maintain message order within a group.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'ProcessOrder',
  description: 'Process orders in FIFO order',
  triggers: [
    { type: 'queue', topic: 'order.created' },
  ],
  infrastructure: {
    queue: {
      type: 'fifo'
    }
  },
  flows: ['orders'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "ProcessOrder",
    "description": "Process orders in FIFO order",
    "triggers": [
        {"type": "queue", "topic": "order.created"}
    ],
    "infrastructure": {
        "queue": {
            "type": "fifo"
        }
    },
    "flows": ["orders"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'ProcessOrder',
  description: 'Process orders in FIFO order',
  triggers: [
    { type: 'queue', topic: 'order.created' },
  ],
  infrastructure: {
    queue: {
      type: 'fifo'
    }
  },
  flows: ['orders']
}
```

</Tab>
</Tabs>

### Message Group ID

When enqueuing to FIFO queues, pass a `messageGroupId`:

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
export const handler: Handlers<typeof config> = async (req, { enqueue }) => {
  const { orderId, customerId } = req.body

  await enqueue({
    topic: 'order.created',
    data: { orderId, customerId },
    messageGroupId: customerId
  })
}
```

</Tab>
<Tab value='Python'>

```python
async def handler(req, ctx):
    order_id = req.body["orderId"]
    customer_id = req.body["customerId"]

    await ctx.enqueue({
        "topic": "order.created",
        "data": {"orderId": order_id, "customerId": customer_id},
        "messageGroupId": customer_id
    })
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (req, { enqueue }) => {
  const { orderId, customerId } = req.body

  await enqueue({
    topic: 'order.created',
    data: { orderId, customerId },
    messageGroupId: customerId
  })
}
```

</Tab>
</Tabs>

The `messageGroupId` ensures events are processed in order within that group.

---

## Default Values

If you don't specify infrastructure settings, Motia uses these defaults:

```typescript
{
  handler: {
    timeout: 30
  },
  queue: {
    type: 'standard',
    maxRetries: 3,
    visibilityTimeout: 900,
    delaySeconds: 0
  }
}
```

---
