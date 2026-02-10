---
title: API Reference
description: Complete API reference for the iii framework
---

Everything you need to know about iii's APIs. This reference covers all the types, methods, and configurations available when building with iii.

If you're new to iii, start with the [Steps guide](/docs/concepts/steps) to understand the basics.

## Step Configuration

Every Step needs a config. The unified `StepConfig` type works for all step types -- the `triggers` array determines what activates the step.

### StepConfig

```typescript
type StepConfig = {
  name: string
  description?: string
  triggers: readonly TriggerConfig[]
  enqueues?: readonly Enqueue[]
  virtualEnqueues?: readonly Enqueue[]
  virtualSubscribes?: readonly string[]
  flows?: readonly string[]
  includeFiles?: readonly string[]
}
```

**Required fields:**
- `name` - Unique identifier for this Step
- `triggers` - Array of triggers that activate this step (API, queue, cron, state, stream)

**Optional fields:**
- `description` - Human-readable description
- `enqueues` - Topics this Step can enqueue
- `virtualEnqueues` - Topics shown in the console but not actually enqueued (gray connections)
- `virtualSubscribes` - Topics shown in the console for flow visualization
- `flows` - Flow names for console grouping
- `includeFiles` - Files to bundle with this Step (supports glob patterns, relative to Step file)

---

### TriggerConfig

Triggers define how a step gets activated. A step can have multiple triggers.

```typescript
type TriggerConfig = QueueTrigger | ApiTrigger | CronTrigger | StateTrigger | StreamTrigger
```

#### ApiTrigger

Use this for HTTP endpoints.

```typescript
type ApiTrigger = {
  type: 'api'
  path: string
  method: ApiRouteMethod
  bodySchema?: StepSchemaInput
  responseSchema?: Record<number, StepSchemaInput>
  queryParams?: readonly QueryParam[]
  middleware?: readonly ApiMiddleware[]
  condition?: TriggerCondition
}
```

#### QueueTrigger

Use this for background jobs and event-driven tasks.

```typescript
type QueueTrigger = {
  type: 'queue'
  topic: string
  input?: StepSchemaInput
  condition?: TriggerCondition
  infrastructure?: Partial<InfrastructureConfig>
}
```

#### CronTrigger

Use this for scheduled tasks.

```typescript
type CronTrigger = {
  type: 'cron'
  expression: string
  condition?: TriggerCondition
}
```

Use [crontab.guru](https://crontab.guru) to build cron expressions.

#### StateTrigger

Use this to trigger steps based on state changes.

```typescript
type StateTrigger = {
  type: 'state'
  condition?: TriggerCondition
}
```

#### StreamTrigger

Use this to trigger steps from stream events.

```typescript
type StreamTrigger = {
  type: 'stream'
  streamName: string
  groupId?: string
  itemId?: string
  condition?: TriggerCondition
}
```

---

### Trigger Helper Functions

Use these helpers for concise trigger definitions:

```typescript
import { api, queue, cron, state, stream } from 'iii'

api(method: ApiRouteMethod, path: string, options?: ApiOptions, condition?: TriggerCondition): ApiTrigger
queue(topic: string, options?: QueueOptions, condition?: TriggerCondition): QueueTrigger
cron(expression: string, condition?: TriggerCondition): CronTrigger
state(condition?: TriggerCondition): StateTrigger
stream(streamName: string, condition?: TriggerCondition): StreamTrigger
```

---

### Enqueue Type

```typescript
type Enqueue = string | { topic: string; label?: string; conditional?: boolean }
type EnqueueData<T> = { topic: string; data: T; messageGroupId?: string }
```

---

### Config Examples

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, Handlers, api, queue, cron } from 'iii'

const config = {
  name: 'CreateUser',
  description: 'Creates a new user',
  triggers: [
    api('POST', '/users', {
      bodySchema: z.object({ name: z.string() }),
      responseSchema: {
        201: z.object({ id: z.string(), name: z.string() })
      },
      middleware: [authMiddleware],
      queryParams: [{ name: 'invite', description: 'Invite code' }],
    }),
  ],
  enqueues: ['user.created'],
  virtualEnqueues: ['notification.sent'],
  virtualSubscribes: ['user.invited'],
  flows: ['user-management'],
  includeFiles: ['../../assets/template.html'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'CreateUser',
  description: 'Creates a new user',
  triggers: [
    {
      type: 'api',
      method: 'POST',
      path: '/users',
      bodySchema: z.object({ name: z.string() }),
      responseSchema: {
        201: z.object({ id: z.string(), name: z.string() })
      },
      middleware: [authMiddleware],
      queryParams: [{ name: 'invite', description: 'Invite code' }],
    },
  ],
  enqueues: ['user.created'],
  virtualEnqueues: ['notification.sent'],
  virtualSubscribes: ['user.invited'],
  flows: ['user-management'],
  includeFiles: ['../../assets/template.html'],
}
```

</Tab>
<Tab value='Python'>

```python
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: str
    name: str

config = {
    "name": "CreateUser",
    "description": "Creates a new user",
    "triggers": [
        {
            "type": "api",
            "method": "POST",
            "path": "/users",
            "bodySchema": {"type": "object", "properties": {"name": {"type": "string"}}},
            "responseSchema": {201: UserResponse.model_json_schema()},
            "middleware": [auth_middleware],
            "queryParams": [{"name": "invite", "description": "Invite code"}],
        },
    ],
    "enqueues": ["user.created"],
    "virtualEnqueues": ["notification.sent"],
    "virtualSubscribes": ["user.invited"],
    "flows": ["user-management"],
    "includeFiles": ["../../assets/template.html"],
}
```

</Tab>
</Tabs>

---

### Queue Step Config Example

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, queue } from 'iii'

const config = {
  name: 'ProcessOrder',
  description: 'Processes new orders',
  triggers: [
    queue('order.created', {
      input: z.object({ orderId: z.string(), amount: z.number() }),
      infrastructure: {
        handler: { ram: 2048, timeout: 60 },
        queue: { type: 'fifo', maxRetries: 3, visibilityTimeout: 90 }
      },
    }),
  ],
  enqueues: ['order.processed'],
  virtualEnqueues: ['payment.initiated'],
  virtualSubscribes: ['order.cancelled'],
  flows: ['orders'],
  includeFiles: ['./templates/*.html'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'ProcessOrder',
  description: 'Processes new orders',
  triggers: [
    {
      type: 'queue',
      topic: 'order.created',
      input: z.object({ orderId: z.string(), amount: z.number() }),
      infrastructure: {
        handler: { ram: 2048, timeout: 60 },
        queue: { type: 'fifo', maxRetries: 3, visibilityTimeout: 90 }
      },
    },
  ],
  enqueues: ['order.processed'],
  virtualEnqueues: ['payment.initiated'],
  virtualSubscribes: ['order.cancelled'],
  flows: ['orders'],
  includeFiles: ['./templates/*.html'],
}
```

</Tab>
<Tab value='Python'>

```python
from pydantic import BaseModel

class OrderInput(BaseModel):
    order_id: str
    amount: float

config = {
    "name": "ProcessOrder",
    "description": "Processes new orders",
    "triggers": [
        {
            "type": "queue",
            "topic": "order.created",
            "input": OrderInput.model_json_schema(),
            "infrastructure": {
                "handler": {"ram": 2048, "timeout": 60},
                "queue": {"type": "fifo", "maxRetries": 3, "visibilityTimeout": 90}
            },
        },
    ],
    "enqueues": ["order.processed"],
    "virtualEnqueues": ["payment.initiated"],
    "virtualSubscribes": ["order.cancelled"],
    "flows": ["orders"],
    "includeFiles": ["./templates/*.html"],
}
```

</Tab>
</Tabs>

**Infrastructure config** (iii Cloud only):
- `handler.ram` - Memory in MB (128-10240, required)
- `handler.cpu` - CPU vCPUs (optional, auto-calculated from RAM if not provided, must be proportional)
- `handler.timeout` - Timeout in seconds (1-900, required)
- `queue.type` - `'fifo'` or `'standard'` (required)
- `queue.maxRetries` - Max retry attempts (0+, required)
- `queue.visibilityTimeout` - Timeout in seconds (required, must be > handler.timeout to prevent premature redelivery)
- `queue.delaySeconds` - Optional delay before message becomes visible (0-900)

---

### Cron Step Config Example

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, cron } from 'iii'

const config = {
  name: 'DailyReport',
  description: 'Generates daily reports at 9 AM',
  triggers: [
    cron('0 9 * * *'),
  ],
  enqueues: ['report.generated'],
  virtualEnqueues: ['email.sent'],
  virtualSubscribes: ['report.requested'],
  flows: ['reporting'],
  includeFiles: ['./templates/report.html'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'DailyReport',
  description: 'Generates daily reports at 9 AM',
  triggers: [
    { type: 'cron', expression: '0 9 * * *' },
  ],
  enqueues: ['report.generated'],
  virtualEnqueues: ['email.sent'],
  virtualSubscribes: ['report.requested'],
  flows: ['reporting'],
  includeFiles: ['./templates/report.html'],
}
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "DailyReport",
    "description": "Generates daily reports at 9 AM",
    "triggers": [
        {"type": "cron", "expression": "0 9 * * *"},
    ],
    "enqueues": ["report.generated"],
    "virtualEnqueues": ["email.sent"],
    "virtualSubscribes": ["report.requested"],
    "flows": ["reporting"],
    "includeFiles": ["./templates/report.html"],
}
```

</Tab>
</Tabs>

---

### Multi-Trigger Step Config Example

A single step can respond to multiple trigger types:

<Tabs items={['TypeScript', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, api, queue, cron } from 'iii'

const config = {
  name: 'UserSync',
  description: 'Syncs user data from multiple sources',
  triggers: [
    api('POST', '/users/sync'),
    queue('user.updated'),
    cron('0 */6 * * *'),
  ],
  enqueues: ['user.synced'],
  flows: ['user-management'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'UserSync',
  description: 'Syncs user data from multiple sources',
  triggers: [
    { type: 'api', method: 'POST', path: '/users/sync' },
    { type: 'queue', topic: 'user.updated' },
    { type: 'cron', expression: '0 */6 * * *' },
  ],
  enqueues: ['user.synced'],
  flows: ['user-management'],
}
```

</Tab>
</Tabs>

---

### NoopConfig

Use this for visual-only nodes in the console (no code execution).

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig } from 'iii'

const config = {
  name: 'ManualApproval',
  description: 'Manager approval gate',
  triggers: [],
  virtualEnqueues: ['approved', 'rejected'],
  virtualSubscribes: ['approval.requested'],
  flows: ['approvals'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'ManualApproval',
  description: 'Manager approval gate',
  triggers: [],
  virtualEnqueues: ['approved', 'rejected'],
  virtualSubscribes: ['approval.requested'],
  flows: ['approvals'],
}
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "ManualApproval",
    "description": "Manager approval gate",
    "triggers": [],
    "virtualEnqueues": ["approved", "rejected"],
    "virtualSubscribes": ["approval.requested"],
    "flows": ["approvals"],
}
```

</Tab>
</Tabs>

**No handler needed** - Noop Steps don't execute code. They exist for console visualization only.

---

## Handlers

Handlers are the functions that execute your business logic. Use the `Handlers` type with your config for full type safety.

### Handlers Type

```typescript
type Handlers<TConfig extends StepConfig> = (
  input: InferHandlerInput<TConfig>,
  ctx: FlowContext<InferEnqueues<TConfig>, InferHandlerInput<TConfig>>,
) => Promise<ApiResponse | void>
```

The handler signature is unified -- the `input` type is inferred from the trigger that activated the step. Use `ctx.match()` or `ctx.is` to differentiate between trigger types in multi-trigger steps.

---

### API Step Handler

Receives a request, returns a response.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, Handlers, api } from 'iii'

const config = {
  name: 'CreateUser',
  triggers: [api('POST', '/users')],
  enqueues: ['user.created'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, ctx) => {
  const { name, email } = req.body
  const userId = crypto.randomUUID()

  await ctx.enqueue({
    topic: 'user.created',
    data: { userId, email }
  })

  return {
    status: 201,
    body: { id: userId, name, email },
    headers: { 'X-Request-ID': ctx.traceId }
  }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (req, ctx) => {
  const { name, email } = req.body
  const userId = crypto.randomUUID()

  await ctx.enqueue({
    topic: 'user.created',
    data: { userId, email }
  })

  return {
    status: 201,
    body: { id: userId, name, email },
    headers: { 'X-Request-ID': ctx.traceId }
  }
}
```

</Tab>
<Tab value='Python'>

```python
import uuid

async def handler(req, context):
    name = req.get("body", {}).get("name")
    email = req.get("body", {}).get("email")
    user_id = str(uuid.uuid4())

    await context.enqueue({
        "topic": "user.created",
        "data": {"user_id": user_id, "email": email}
    })

    return {
        "status": 201,
        "body": {"id": user_id, "name": name, "email": email},
        "headers": {"X-Request-ID": context.trace_id}
    }
```

</Tab>
</Tabs>

---

### Queue Step Handler

Receives queue data, processes it. No return value.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, Handlers, queue } from 'iii'

const config = {
  name: 'ProcessOrder',
  triggers: [queue('order.created', { input: z.object({ orderId: z.string(), amount: z.number() }) })],
  enqueues: ['order.processed'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, ctx) => {
  const data = ctx.getData()
  const { orderId, amount } = data

  ctx.logger.info('Processing order', { orderId, amount })

  await ctx.state.set('orders', orderId, {
    id: orderId,
    amount,
    status: 'processed'
  })

  await ctx.enqueue({
    topic: 'order.processed',
    data: { orderId }
  })
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (input, ctx) => {
  const data = ctx.getData()
  const { orderId, amount } = data

  ctx.logger.info('Processing order', { orderId, amount })

  await ctx.state.set('orders', orderId, {
    id: orderId,
    amount,
    status: 'processed'
  })

  await ctx.enqueue({
    topic: 'order.processed',
    data: { orderId }
  })
}
```

</Tab>
<Tab value='Python'>

```python
async def handler(input_data, context):
    order_id = input_data.get("order_id")
    amount = input_data.get("amount")

    context.logger.info("Processing order", {"order_id": order_id, "amount": amount})

    await context.state.set("orders", order_id, {
        "id": order_id,
        "amount": amount,
        "status": "processed"
    })

    await context.enqueue({
        "topic": "order.processed",
        "data": {"order_id": order_id}
    })
```

</Tab>
</Tabs>

---

### Cron Step Handler

Runs on a schedule. Only receives context.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, Handlers, cron } from 'iii'

const config = {
  name: 'DailyCleanup',
  triggers: [cron('0 0 * * *')],
  enqueues: [],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, ctx) => {
  ctx.logger.info('Running daily cleanup')

  const oldOrders = await ctx.state.list('orders')
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000)

  for (const order of oldOrders) {
    if (order.createdAt < cutoff) {
      await ctx.state.delete('orders', order.id)
    }
  }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (input, ctx) => {
  ctx.logger.info('Running daily cleanup')

  const oldOrders = await ctx.state.list('orders')
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000)

  for (const order of oldOrders) {
    if (order.createdAt < cutoff) {
      await ctx.state.delete('orders', order.id)
    }
  }
}
```

</Tab>
<Tab value='Python'>

```python
from datetime import datetime, timedelta

async def handler(input_data, context):
    context.logger.info("Running daily cleanup")

    old_orders = await context.state.list("orders")
    cutoff = (datetime.now() - timedelta(days=30)).timestamp()

    for order in old_orders:
        if order.get("created_at") < cutoff:
            await context.state.delete("orders", order.get("id"))
```

</Tab>
</Tabs>

---

### Multi-Trigger Handler with match()

For steps with multiple triggers, use `ctx.match()` to handle each trigger type:

<Tabs items={['TypeScript', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { StepConfig, Handlers, api, queue, cron } from 'iii'

const config = {
  name: 'UserSync',
  triggers: [
    api('POST', '/users/sync'),
    queue('user.updated'),
    cron('0 */6 * * *'),
  ],
  enqueues: ['user.synced'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, ctx) => {
  return ctx.match({
    api: async (request) => {
      const { userId } = request.body
      await syncUser(userId, ctx)
      return { status: 200, body: { synced: true } }
    },
    queue: async (data) => {
      const payload = ctx.getData()
      await syncUser(payload.userId, ctx)
    },
    cron: async () => {
      const allUsers = await ctx.state.list('users')
      for (const user of allUsers) {
        await syncUser(user.id, ctx)
      }
    },
  })
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (input, ctx) => {
  return ctx.match({
    api: async (request) => {
      const { userId } = request.body
      await syncUser(userId, ctx)
      return { status: 200, body: { synced: true } }
    },
    queue: async (data) => {
      const payload = ctx.getData()
      await syncUser(payload.userId, ctx)
    },
    cron: async () => {
      const allUsers = await ctx.state.list('users')
      for (const user of allUsers) {
        await syncUser(user.id, ctx)
      }
    },
  })
}
```

</Tab>
</Tabs>

You can also use `ctx.is` for simpler checks:

```typescript
if (ctx.is.api(input)) {
  return { status: 200, body: { ok: true } }
}
if (ctx.is.queue(input)) {
  const data = ctx.getData()
}
if (ctx.is.cron(input)) {
  // scheduled execution
}
```

---

## Handler Context (FlowContext)

Every handler gets a context object (`ctx` in TypeScript/JavaScript, `context` in Python) with these tools.

```typescript
interface FlowContext<TEnqueueData, TInput> {
  enqueue: Enqueuer<TEnqueueData>
  traceId: string
  state: InternalStateManager
  logger: Logger
  streams: Streams
  trigger: TriggerInfo
  is: {
    queue: (input) => boolean
    api: (input) => boolean
    cron: (input) => boolean
    state: (input) => boolean
    stream: (input) => boolean
  }
  getData: () => ExtractDataPayload<TInput>
  match: <TResult>(handlers: MatchHandlers) => Promise<TResult | void>
}
```

### enqueue

Trigger other Steps by publishing messages to topics.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
await ctx.enqueue({
  topic: 'order.created',
  data: { orderId: '123', total: 99.99 }
})

await ctx.enqueue({
  topic: 'order.processing',
  data: { orderId: '123', items: [...] },
  messageGroupId: 'user-456'
})
```

**FIFO queues:** When enqueuing to a topic that has a FIFO queue subscriber, you **must** include `messageGroupId`. Messages with the same `messageGroupId` are processed sequentially. Different groups are processed in parallel.

</Tab>
<Tab value='JavaScript'>

```javascript
await ctx.enqueue({
  topic: 'order.created',
  data: { orderId: '123', total: 99.99 }
})

await ctx.enqueue({
  topic: 'order.processing',
  data: { orderId: '123', items: [...] },
  messageGroupId: 'user-456'
})
```

**FIFO queues:** When enqueuing to a topic that has a FIFO queue subscriber, you **must** include `messageGroupId`. Messages with the same `messageGroupId` are processed sequentially. Different groups are processed in parallel.

</Tab>
<Tab value='Python'>

```python
await context.enqueue({
    "topic": "order.created",
    "data": {"order_id": "123", "total": 99.99}
})

await context.enqueue({
    "topic": "order.processing",
    "data": {"order_id": "123", "items": [...]},
    "messageGroupId": "user-456"
})
```

**FIFO queues:** When enqueuing to a topic that has a FIFO queue subscriber, you **must** include `messageGroupId`. Messages with the same `messageGroupId` are processed sequentially. Different groups are processed in parallel.

</Tab>
</Tabs>

The `data` must match the `input` schema of Steps subscribing to that topic.

---

### logger

Structured logging with automatic trace ID correlation.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
logger.info('User created', { userId: '123', email: 'user@example.com' })
logger.warn('Rate limit approaching', { current: 95, limit: 100 })
logger.error('Payment failed', { error: err.message, orderId: '456' })
logger.debug('Cache miss', { key: 'user:123' })
```

</Tab>
<Tab value='JavaScript'>

```javascript
logger.info('User created', { userId: '123', email: 'user@example.com' })
logger.warn('Rate limit approaching', { current: 95, limit: 100 })
logger.error('Payment failed', { error: err.message, orderId: '456' })
logger.debug('Cache miss', { key: 'user:123' })
```

</Tab>
<Tab value='Python'>

```python
context.logger.info("User created", {"user_id": "123", "email": "user@example.com"})
context.logger.warn("Rate limit approaching", {"current": 95, "limit": 100})
context.logger.error("Payment failed", {"error": str(err), "order_id": "456"})
context.logger.debug("Cache miss", {"key": "user:123"})
```

</Tab>
</Tabs>

All logs are automatically tagged with:
- Timestamp
- Step name
- Trace ID
- Any metadata you pass

[Learn more about Observability](/docs/development-guide/observability)

---

### state

Persistent key-value storage shared across Steps.

```typescript
interface InternalStateManager {
  get<T>(groupId: string, key: string): Promise<T | null>
  set<T>(groupId: string, key: string, value: T): Promise<StreamSetResult<T> | null>
  update<T>(groupId: string, key: string, ops: UpdateOp[]): Promise<StreamSetResult<T> | null>
  delete<T>(groupId: string, key: string): Promise<T | null>
  list<T>(groupId: string): Promise<T[]>
  clear(groupId: string): Promise<void>
}

type StreamSetResult<T> = { new_value: T; old_value: T | null }

type UpdateOp =
  | { type: 'set', path: string, value: any }
  | { type: 'increment', path: string, by: number }
  | { type: 'decrement', path: string, by: number }
```

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
await state.set('users', 'user-123', { name: 'Alice', email: 'alice@example.com' })

const user = await state.get<User>('users', 'user-123')

const allUsers = await state.list<User>('users')

await state.update('users', 'user-123', [
  { type: 'set', path: 'name', value: 'Bob' },
  { type: 'increment', path: 'loginCount', by: 1 },
])

await state.delete('users', 'user-123')

await state.clear('users')
```

</Tab>
<Tab value='JavaScript'>

```javascript
await state.set('users', 'user-123', { name: 'Alice', email: 'alice@example.com' })

const user = await state.get('users', 'user-123')

const allUsers = await state.list('users')

await state.update('users', 'user-123', [
  { type: 'set', path: 'name', value: 'Bob' },
  { type: 'increment', path: 'loginCount', by: 1 },
])

await state.delete('users', 'user-123')

await state.clear('users')
```

</Tab>
<Tab value='Python'>

```python
await context.state.set("users", "user-123", {"name": "Alice", "email": "alice@example.com"})

user = await context.state.get("users", "user-123")

all_users = await context.state.list("users")

await context.state.update("users", "user-123", [
    {"type": "set", "path": "name", "value": "Bob"},
    {"type": "increment", "path": "loginCount", "by": 1},
])

await context.state.delete("users", "user-123")

await context.state.clear("users")
```

</Tab>
</Tabs>

**Methods:**

- `get(groupId, key)` - Returns the value or `null`
- `set(groupId, key, value)` - Stores the value and returns `{ new_value, old_value }`
- `update(groupId, key, ops)` - Applies atomic update operations and returns `{ new_value, old_value }`
- `delete(groupId, key)` - Removes and returns the value (or `null`)
- `list(groupId)` - Returns array of all values in the group
- `clear(groupId)` - Removes all items in the group

[Learn more about State](/docs/development-guide/state-management)

---

### streams

Real-time data channels for pushing updates to connected clients.

```typescript
interface MotiaStream<TData> {
  get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  set(groupId: string, id: string, data: TData): Promise<StreamSetResult<BaseStreamItem<TData>>>
  delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  getGroup(groupId: string): Promise<BaseStreamItem<TData>[]>
  update(groupId: string, id: string, data: UpdateOp[]): Promise<StreamSetResult<BaseStreamItem<TData>>>
  send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void>
}
```

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
await streams.chatMessages.set('room-123', 'msg-456', {
  text: 'Hello!',
  author: 'Alice',
  timestamp: new Date().toISOString()
})

const message = await streams.chatMessages.get('room-123', 'msg-456')

const messages = await streams.chatMessages.getGroup('room-123')

await streams.chatMessages.delete('room-123', 'msg-456')

await streams.chatMessages.update('room-123', 'msg-456', [
  { type: 'set', path: 'text', value: 'Updated message' },
])

await streams.chatMessages.send(
  { groupId: 'room-123' },
  { type: 'user.typing', data: { userId: 'alice' } }
)
```

</Tab>
<Tab value='JavaScript'>

```javascript
await streams.chatMessages.set('room-123', 'msg-456', {
  text: 'Hello!',
  author: 'Alice',
  timestamp: new Date().toISOString()
})

const message = await streams.chatMessages.get('room-123', 'msg-456')

const messages = await streams.chatMessages.getGroup('room-123')

await streams.chatMessages.delete('room-123', 'msg-456')

await streams.chatMessages.update('room-123', 'msg-456', [
  { type: 'set', path: 'text', value: 'Updated message' },
])

await streams.chatMessages.send(
  { groupId: 'room-123' },
  { type: 'user.typing', data: { userId: 'alice' } }
)
```

</Tab>
<Tab value='Python'>

```python
await context.streams.chatMessages.set("room-123", "msg-456", {
    "text": "Hello!",
    "author": "Alice",
    "timestamp": datetime.now().isoformat()
})

message = await context.streams.chatMessages.get("room-123", "msg-456")

messages = await context.streams.chatMessages.getGroup("room-123")

await context.streams.chatMessages.delete("room-123", "msg-456")

await context.streams.chatMessages.update("room-123", "msg-456", [
    {"type": "set", "path": "text", "value": "Updated message"},
])

await context.streams.chatMessages.send(
    {"groupId": "room-123"},
    {"type": "user.typing", "data": {"user_id": "alice"}}
)
```

</Tab>
</Tabs>

**Methods:**

- `set(groupId, id, data)` - Create or update an item (returns `{ new_value, old_value }`)
- `get(groupId, id)` - Retrieve an item or `null`
- `getGroup(groupId)` - Get all items in a group
- `delete(groupId, id)` - Remove an item
- `update(groupId, id, ops)` - Apply atomic update operations
- `send(channel, event)` - Send an ephemeral event (e.g., typing indicators, reactions)

[Learn more about Streams](/docs/development-guide/streams)

---

### traceId

Unique ID for tracking requests across Steps.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
export const handler: Handlers<typeof config> = async (req, { traceId, logger }) => {
  logger.info('Processing request', { traceId })
  return { status: 200, body: { traceId } }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (req, { traceId, logger }) => {
  logger.info('Processing request', { traceId })
  return { status: 200, body: { traceId } }
}
```

</Tab>
<Tab value='Python'>

```python
async def handler(req, context):
    context.logger.info("Processing request", {"trace_id": context.trace_id})
    return {"status": 200, "body": {"trace_id": context.trace_id}}
```

</Tab>
</Tabs>

The trace ID is automatically generated for each request and passed through all Steps in the workflow. Use it to correlate logs, state, and events.

---

### trigger

Information about what triggered the current handler execution.

```typescript
interface TriggerInfo {
  type: 'api' | 'queue' | 'cron' | 'state' | 'stream'
}
```

---

### getData

Extract the data payload from the input. Useful in queue and stream handlers.

```typescript
const data = ctx.getData()
```

---

### match

Route execution based on trigger type. See [Multi-Trigger Handler with match()](#multi-trigger-handler-with-match) above.

```typescript
type MatchHandlers<TInput, TEnqueueData, TResult> = {
  queue?: (input) => Promise<void>
  api?: (request) => Promise<TResult>
  cron?: () => Promise<void>
  state?: (input) => Promise<TResult>
  stream?: (input) => Promise<TResult>
  default?: (input) => Promise<TResult | void>
}
```

---

## Middleware

Intercepts API requests before and after the handler.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { ApiMiddleware } from 'iii'

export const authMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const token = req.headers.authorization

  if (!token) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  return await next()
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const authMiddleware = async (req, ctx, next) => {
  const token = req.headers.authorization

  if (!token) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  return await next()
}
```

</Tab>
<Tab value='Python'>

```python
async def auth_middleware(req, context, next_fn):
    token = req.get("headers", {}).get("authorization")

    if not token:
        return {"status": 401, "body": {"error": "Unauthorized"}}

    return await next_fn()
```

</Tab>
</Tabs>

**Parameters:**
- `req` - Request object
- `ctx` - Context object
- `next` - Function to call the next middleware/handler

**Returns:** Response object

[Learn more about Middleware](/docs/development-guide/middleware)

---

## Request Object (ApiRequest)

API handlers receive a request object with these fields.

```typescript
interface ApiRequest<TBody = unknown> {
  pathParams: Record<string, string>
  queryParams: Record<string, string | string[]>
  body: TBody
  headers: Record<string, string | string[]>
}
```

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
export const handler: Handlers<typeof config> = async (req, ctx) => {
  const userId = req.pathParams.id
  const page = req.queryParams.page
  const limit = req.queryParams.limit
  const { name, email } = req.body
  const auth = req.headers.authorization

  return { status: 200, body: { userId, name } }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (req, ctx) => {
  const userId = req.pathParams.id
  const page = req.queryParams.page
  const limit = req.queryParams.limit
  const { name, email } = req.body
  const auth = req.headers.authorization

  return { status: 200, body: { userId, name } }
}
```

</Tab>
<Tab value='Python'>

```python
async def handler(req, context):
    user_id = req.get("pathParams", {}).get("id")
    page = req.get("queryParams", {}).get("page")
    limit = req.get("queryParams", {}).get("limit")
    body = req.get("body", {})
    name = body.get("name")
    email = body.get("email")
    auth = req.get("headers", {}).get("authorization")

    return {"status": 200, "body": {"user_id": user_id, "name": name}}
```

</Tab>
</Tabs>

**Fields:**
- `pathParams` - Object with path parameters (e.g., `:id` from `/users/:id`)
- `queryParams` - Object with query string params (values can be string or array)
- `body` - Parsed request body (validated against `bodySchema` if defined)
- `headers` - Object with request headers (values can be string or array)

---

## Response Object (ApiResponse)

API handlers must return an object with these fields.

```typescript
type ApiResponse<TStatus extends number, TBody> = {
  status: TStatus
  headers?: Record<string, string>
  body: TBody
}
```

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
return {
  status: 200,
  body: { id: '123', name: 'Alice' },
  headers: {
    'Cache-Control': 'max-age=3600',
    'X-Custom-Header': 'value'
  }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
return {
  status: 200,
  body: { id: '123', name: 'Alice' },
  headers: {
    'Cache-Control': 'max-age=3600',
    'X-Custom-Header': 'value'
  }
}
```

</Tab>
<Tab value='Python'>

```python
return {
    "status": 200,
    "body": {"id": "123", "name": "Alice"},
    "headers": {
        "Cache-Control": "max-age=3600",
        "X-Custom-Header": "value"
    }
}
```

</Tab>
</Tabs>

**Fields:**
- `status` - HTTP status code (200, 201, 400, 404, 500, etc.)
- `body` - Response data (will be JSON-encoded automatically)
- `headers` - Optional custom headers

---

## Stream Configuration

Define real-time data streams for your app.

```typescript
interface StreamConfig {
  name: string
  schema: StepSchemaInput
  baseConfig: { storageType: 'default' }
  onJoin?: (subscription, context, authContext?) => StreamJoinResult
  onLeave?: (subscription, context, authContext?) => void
}
```

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript title="src/chat-messages.stream.ts"
import { StreamConfig } from 'iii'
import { z } from 'zod'

export const config: StreamConfig = {
  name: 'chatMessages',
  schema: z.object({
    text: z.string(),
    author: z.string(),
    timestamp: z.string()
  }),
  baseConfig: {
    storageType: 'default'
  }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript title="src/chat-messages.stream.js"
import { z } from 'zod'

export const config = {
  name: 'chatMessages',
  schema: z.object({
    text: z.string(),
    author: z.string(),
    timestamp: z.string()
  }),
  baseConfig: {
    storageType: 'default'
  }
}
```

</Tab>
<Tab value='Python'>

```python title="src/chat_messages_stream.py"
from pydantic import BaseModel

class ChatMessage(BaseModel):
    text: str
    author: str
    timestamp: str

config = {
    "name": "chatMessages",
    "schema": ChatMessage.model_json_schema(),
    "baseConfig": {
        "storageType": "default"
    }
}
```

</Tab>
</Tabs>

**Fields:**
- `name` - Unique stream name (used in `ctx.streams.<name>`)
- `schema` - Zod schema (TS/JS) or JSON Schema (Python) for data validation
- `baseConfig.storageType` - Always `'default'` (custom storage coming soon)
- `onJoin` - Optional callback when a client subscribes
- `onLeave` - Optional callback when a client unsubscribes

File naming:
- TypeScript/JavaScript: `*.stream.ts` or `*.stream.js`
- Python: `*_stream.py`

---

## CLI Commands

iii's command-line tools for development and deployment.

### `iii version`

Show iii CLI version.

```bash
iii version
iii -V
iii --version
```

---

### `iii create`

Create a new iii project.

```bash
npx iii create my-app
npx iii create .
npx iii create --template iii-tutorial-python my-python-app
```

**Options:**
- `[name]` - Project name (or `.` for current directory)
- `-t, --template <name>` - Template to use. Available options:

| Template | Description | Use Case |
|----------|-------------|----------|
| `iii-tutorial-typescript` | Tutorial (TypeScript only) | Interactive tutorial project in TypeScript |
| `iii-tutorial-python` | Tutorial (Python only) | Interactive tutorial project in Python |
| `starter-multilang` | Starter (All languages; TS/JS + Python) | Polyglot project with TypeScript API, Python queue processing, and JavaScript logging |
| `starter-typescript` | Starter (TypeScript only) | Minimal TypeScript project with basic examples |
| `starter-javascript` | Starter (JavaScript only) | Minimal JavaScript project with basic examples |
| `starter-python` | Starter (Python only) | Minimal Python project with basic examples |

- `-c, --cursor` - Add Cursor IDE rules

---

### `iii rules pull`

Install AI development guides (AGENTS.md, CLAUDE.md) and Cursor IDE rules.

```bash
iii rules pull
iii rules pull --force
```

**Options:**
- `-f, --force` - Overwrite existing files

---

### `iii dev`

Start development server with console and hot reload.

```bash
npm run dev
iii dev --port 4000 --host 0.0.0.0
```

**Options:**
- `-p, --port <number>` - Port number (default: 3000)
- `-H, --host <address>` - Host address (default: localhost)
- `-d, --debug` - Enable debug logging
- `--iii-dir <path>` - Custom path for `.iii` folder

---

### `iii start`

Start production server without hot reload. Console is included by default (can be disabled via `III_DOCKER_DISABLE_CONSOLE` environment variable).

```bash
iii start
iii start --port 8080 --host 0.0.0.0
```

**Options:**
- `-p, --port <number>` - Port number (default: 3000)
- `-H, --host <address>` - Host address (default: localhost)
- `-d, --debug` - Enable debug logging
- `--iii-dir <path>` - Custom path for `.iii` folder

---

### `iii build`

Build your project for deployment.

```bash
iii build
```

Compiles all Steps and generates deployment artifacts.

---

### `iii generate-types`

Generate TypeScript types from your Step configs.

```bash
iii generate-types
```

Creates `types.d.ts` with type-safe `Handlers` interface. Run this after changing Step configs.

---

### `iii generate step`

Create a new Step interactively.

```bash
iii generate step
iii generate step --dir users/create-user
```

**Options:**
- `-d, --dir <path>` - Path relative to `src/` directory

---

### `iii install`

Set up Python virtual environment and install dependencies.

```bash
iii install
npm run dev
```

---

### `iii enqueue`

Manually enqueue a message (for testing).

```bash
iii enqueue --topic user.created --message '{"userId":"123"}'
iii enqueue --topic order.created --message '{"orderId":"456"}' --port 3000
```

**Options:**
- `--topic <topic>` - Topic name
- `--message <json>` - Message data as JSON string
- `-p, --port <number>` - Server port (default: 3000)

---

### `iii docker setup`

Generate Dockerfile and .dockerignore.

```bash
iii docker setup
```

---

### `iii docker build`

Build Docker image.

```bash
iii docker build
iii docker build --project-name my-app
```

---

### `iii docker run`

Build and run Docker container.

```bash
iii docker run
iii docker run --port 8080 --skip-build
```

**Options:**
- `-p, --port <number>` - Host port to map (default: 3000)
- `-n, --project-name <name>` - Docker image name
- `-s, --skip-build` - Skip building the image

---

### `iii cloud deploy`

Deploy to iii Cloud.

```bash
iii cloud deploy -k YOUR_API_KEY -v v1.0.0
iii cloud deploy --api-key YOUR_API_KEY --version-name v1.2.0 --environment-name production
```

**Options:**
- `-k, --api-key <key>` - iii Cloud API key (or set `III_API_KEY` env var)
- `-v, --version-name <version>` - Version name/tag for this deployment
- `-n, --project-name <name>` - Project name (for new projects)
- `-s, --environment-id <id>` - Environment ID
- `--environment-name <name>` - Environment name
- `-e, --env-file <path>` - Path to environment variables file
- `-d, --version-description <desc>` - Version description
- `-c, --ci` - CI mode (non-interactive)

---

## Common Patterns

### Enqueue Types

You can enqueue topics as strings or objects with labels.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
enqueues: ['user.created', 'email.sent']

enqueues: [
  { topic: 'order.approved', label: 'Auto-approved' },
  { topic: 'order.rejected', label: 'Requires review', conditional: true }
]
```

</Tab>
<Tab value='JavaScript'>

```javascript
enqueues: ['user.created', 'email.sent']

enqueues: [
  { topic: 'order.approved', label: 'Auto-approved' },
  { topic: 'order.rejected', label: 'Requires review', conditional: true }
]
```

</Tab>
<Tab value='Python'>

```python
"enqueues": ["user.created", "email.sent"]

"enqueues": [
    {"topic": "order.approved", "label": "Auto-approved"},
    {"topic": "order.rejected", "label": "Requires review", "conditional": True}
]
```

</Tab>
</Tabs>

The `label` and `conditional` fields are for console visualization only. They don't affect execution.

---

### Query Parameters

Document query params for the console.

```typescript
queryParams: [
  { name: 'page', description: 'Page number for pagination' },
  { name: 'limit', description: 'Number of items per page' },
  { name: 'sort', description: 'Sort field (e.g., createdAt, name)' }
]
```

This shows up in the console endpoint tester.

---

### Include Files

Bundle files with your Step (useful for templates, assets, binaries).

```typescript
includeFiles: [
  './templates/email.html',
  './assets/*.png',
  '../../lib/stockfish'
]
```

Files are copied into the deployment bundle and accessible at runtime.

---

## What's Next?

<Cards>
  <Card href="/docs/concepts/steps" title="Steps">
    Learn how to build with Steps
  </Card>

  <Card href="/docs/development-guide/state-management" title="State Management">
    Deep dive into the State API
  </Card>

  <Card href="/docs/development-guide/streams" title="Streams">
    Real-time streaming guide
  </Card>

  <Card href="/docs/development-guide/middleware" title="Middleware">
    Request/response middleware patterns
  </Card>

  <Card href="/docs/examples" title="Examples">
    See these APIs in action
  </Card>
</Cards>
