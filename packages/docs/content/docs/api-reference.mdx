---
title: API Reference
description: Complete API reference for Motia framework
---

Everything you need to know about Motia's APIs. This reference covers all the types, methods, and configurations available when building with Motia.

If you're new to Motia, start with the [Steps guide](/docs/concepts/steps) to understand the basics.

## Step Configurations

Every Step needs a config. Here's what you can put in it.

### ApiRouteConfig

Use this for HTTP endpoints.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { ApiRouteConfig } from 'motia'

const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateUser',
  path: '/users',
  method: 'POST',
  emits: ['user.created'],
  
  // Optional fields
  description: 'Creates a new user',
  flows: ['user-management'],
  bodySchema: z.object({ name: z.string() }),
  responseSchema: {
    201: z.object({ id: z.string(), name: z.string() })
  },
  middleware: [authMiddleware],
  queryParams: [{ name: 'invite', description: 'Invite code' }],
  virtualEmits: ['notification.sent'],
  virtualSubscribes: ['user.invited'],
  includeFiles: ['../../assets/template.html']
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  type: 'api',
  name: 'CreateUser',
  path: '/users',
  method: 'POST',
  emits: ['user.created'],
  
  // Optional fields
  description: 'Creates a new user',
  flows: ['user-management'],
  bodySchema: z.object({ name: z.string() }),
  responseSchema: {
    201: z.object({ id: z.string(), name: z.string() })
  },
  middleware: [authMiddleware],
  queryParams: [{ name: 'invite', description: 'Invite code' }],
  virtualEmits: ['notification.sent'],
  virtualSubscribes: ['user.invited'],
  includeFiles: ['../../assets/template.html']
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
    "type": "api",
    "name": "CreateUser",
    "path": "/users",
    "method": "POST",
    "emits": ["user.created"],
    
    # Optional fields
    "description": "Creates a new user",
    "flows": ["user-management"],
    "bodySchema": {"type": "object", "properties": {"name": {"type": "string"}}},
    "responseSchema": {201: UserResponse.model_json_schema()},
    "middleware": [auth_middleware],
    "queryParams": [{"name": "invite", "description": "Invite code"}],
    "virtualEmits": ["notification.sent"],
    "virtualSubscribes": ["user.invited"],
    "includeFiles": ["../../assets/template.html"]
}
```

</Tab>
</Tabs>

**Required fields:**
- `type` - Always `'api'`
- `name` - Unique identifier for this Step
- `path` - URL path (supports params like `/users/:id`)
- `method` - HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD`)
- `emits` - Topics this Step can emit (list all, even if empty `[]`)

**Optional fields:**
- `description` - Human-readable description
- `flows` - Flow names for Workbench grouping
- `bodySchema` - Zod schema (TS/JS) or JSON Schema (Python). Can be ZodObject or ZodArray. **Note:** Schema is not validated automatically. Use middleware or validate manually in your handler with `.parse()` or `.safeParse()`.
- `responseSchema` - Map of status codes to response schemas (used for type generation and OpenAPI)
- `middleware` - Functions to run before the handler (executed in array order)
- `queryParams` - Query parameter docs for Workbench
- `virtualEmits` - Topics shown in Workbench but not actually emitted (gray connections)
- `virtualSubscribes` - Topics shown in Workbench for flow visualization (useful for chaining HTTP requests)
- `includeFiles` - Files to bundle with this Step (supports glob patterns, relative to Step file)

---

### EventConfig

Use this for background jobs and event-driven tasks.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { EventConfig } from 'motia'

const config: EventConfig = {
  type: 'event',
  name: 'ProcessOrder',
  subscribes: ['order.created'],
  input: z.object({ orderId: z.string(), amount: z.number() }),
  emits: ['order.processed'],
  
  // Optional fields
  description: 'Processes new orders',
  flows: ['orders'],
  virtualEmits: ['payment.initiated'],
  virtualSubscribes: ['order.cancelled'],
  includeFiles: ['./templates/*.html'],
  infrastructure: {
    handler: { ram: 2048, timeout: 60 },
    queue: { type: 'fifo', maxRetries: 3, visibilityTimeout: 90 }
  }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  type: 'event',
  name: 'ProcessOrder',
  subscribes: ['order.created'],
  input: z.object({ orderId: z.string(), amount: z.number() }),
  emits: ['order.processed'],
  
  // Optional fields
  description: 'Processes new orders',
  flows: ['orders'],
  virtualEmits: ['payment.initiated'],
  virtualSubscribes: ['order.cancelled'],
  includeFiles: ['./templates/*.html']
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
    "type": "event",
    "name": "ProcessOrder",
    "subscribes": ["order.created"],
    "input": OrderInput.model_json_schema(),
    "emits": ["order.processed"],
    
    # Optional fields
    "description": "Processes new orders",
    "flows": ["orders"],
    "virtualEmits": ["payment.initiated"],
    "virtualSubscribes": ["order.cancelled"],
    "includeFiles": ["./templates/*.html"],
    "infrastructure": {
        "handler": {"ram": 2048, "timeout": 60},
        "queue": {"type": "fifo", "maxRetries": 3, "visibilityTimeout": 90}
    }
}
```

</Tab>
</Tabs>

**Required fields:**
- `type` - Always `'event'`
- `name` - Unique identifier
- `subscribes` - Topic names to listen to
- `input` - Zod schema (TS/JS) or JSON Schema (Python) for event data. **Note:** Validation is not automatic. In Python, manually validate with Pydantic if needed.
- `emits` - Topics this Step can emit

**Optional fields:**
- `description` - Human-readable description
- `flows` - Flow names for Workbench
- `virtualEmits` / `virtualSubscribes` - For Workbench visualization only
- `includeFiles` - Files to bundle with this Step (supports glob patterns)
- `infrastructure` - Resource limits and queue config (Event Steps only, Motia Cloud)

**Infrastructure config** (Motia Cloud only):
- `handler.ram` - Memory in MB (128-10240, required)
- `handler.cpu` - CPU vCPUs (optional, auto-calculated from RAM if not provided, must be proportional)
- `handler.timeout` - Timeout in seconds (1-900, required)
- `queue.type` - `'fifo'` or `'standard'` (required)
- `queue.maxRetries` - Max retry attempts (0+, required)
- `queue.visibilityTimeout` - Timeout in seconds (required, must be > handler.timeout to prevent premature redelivery)
- `queue.delaySeconds` - Optional delay before message becomes visible (0-900)

---

### CronConfig

Use this for scheduled tasks.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { CronConfig } from 'motia'

const config: CronConfig = {
  type: 'cron',
  name: 'DailyReport',
  cron: '0 9 * * *',
  emits: ['report.generated'],
  
  // Optional fields
  description: 'Generates daily reports at 9 AM',
  flows: ['reporting'],
  virtualEmits: ['email.sent'],
  virtualSubscribes: ['report.requested'],
  includeFiles: ['./templates/report.html']
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  type: 'cron',
  name: 'DailyReport',
  cron: '0 9 * * *',
  emits: ['report.generated'],
  
  // Optional fields
  description: 'Generates daily reports at 9 AM',
  flows: ['reporting'],
  virtualEmits: ['email.sent'],
  virtualSubscribes: ['report.requested'],
  includeFiles: ['./templates/report.html']
}
```

</Tab>
<Tab value='Python'>

```python
config = {
    "type": "cron",
    "name": "DailyReport",
    "cron": "0 9 * * *",
    "emits": ["report.generated"],
    
    # Optional fields
    "description": "Generates daily reports at 9 AM",
    "flows": ["reporting"],
    "virtualEmits": ["email.sent"],
    "virtualSubscribes": ["report.requested"],
    "includeFiles": ["./templates/report.html"]
}
```

</Tab>
</Tabs>

**Required fields:**
- `type` - Always `'cron'`
- `name` - Unique identifier
- `cron` - Cron expression (e.g., `'0 9 * * *'` for 9 AM daily)
- `emits` - Topics this Step can emit

**Optional fields:**
- `description`, `flows`, `virtualEmits`, `virtualSubscribes`, `includeFiles` - Same as above

👉 Use [crontab.guru](https://crontab.guru) to build cron expressions.

---

### NoopConfig

Use this for visual-only nodes in Workbench (no code execution).

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { NoopConfig } from 'motia'

const config: NoopConfig = {
  type: 'noop',
  name: 'ManualApproval',
  virtualEmits: ['approved', 'rejected'],
  virtualSubscribes: ['approval.requested'],
  
  // Optional fields
  description: 'Manager approval gate',
  flows: ['approvals']
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  type: 'noop',
  name: 'ManualApproval',
  virtualEmits: ['approved', 'rejected'],
  virtualSubscribes: ['approval.requested'],
  
  // Optional fields
  description: 'Manager approval gate',
  flows: ['approvals']
}
```

</Tab>
<Tab value='Python'>

```python
config = {
    "type": "noop",
    "name": "ManualApproval",
    "virtualEmits": ["approved", "rejected"],
    "virtualSubscribes": ["approval.requested"],
    
    # Optional fields
    "description": "Manager approval gate",
    "flows": ["approvals"]
}
```

</Tab>
</Tabs>

**Required fields:**
- `type` - Always `'noop'`
- `name` - Unique identifier
- `virtualEmits` - Topics shown in Workbench
- `virtualSubscribes` - Topics shown in Workbench

**No handler needed** - NOOP Steps don't execute code.

---

## Handler Context

Every handler gets a context object (`ctx` in TypeScript/JavaScript, `context` in Python) with these tools.

### emit

Trigger other Steps by publishing events.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
// Standard emit
await emit({
  topic: 'order.created',
  data: { orderId: '123', total: 99.99 }
})

// FIFO queue emit (when subscriber uses queue.type: 'fifo')
await emit({
  topic: 'order.processing',
  data: { orderId: '123', items: [...] },
  messageGroupId: 'user-456'  // Required for FIFO queues
})
```

**FIFO queues:** When emitting to a topic that has a FIFO queue subscriber, you **must** include `messageGroupId`. Messages with the same `messageGroupId` are processed sequentially. Different groups are processed in parallel.

</Tab>
<Tab value='JavaScript'>

```javascript
// Standard emit
await emit({
  topic: 'order.created',
  data: { orderId: '123', total: 99.99 }
})

// FIFO queue emit (when subscriber uses queue.type: 'fifo')
await emit({
  topic: 'order.processing',
  data: { orderId: '123', items: [...] },
  messageGroupId: 'user-456'  // Required for FIFO queues
})
```

**FIFO queues:** When emitting to a topic that has a FIFO queue subscriber, you **must** include `messageGroupId`. Messages with the same `messageGroupId` are processed sequentially. Different groups are processed in parallel.

</Tab>
<Tab value='Python'>

```python
# Standard emit
await context.emit({
    "topic": "order.created",
    "data": {"order_id": "123", "total": 99.99}
})

# FIFO queue emit (when subscriber uses queue.type: 'fifo')
await context.emit({
    "topic": "order.processing",
    "data": {"order_id": "123", "items": [...]},
    "messageGroupId": "user-456"  # Required for FIFO queues
})
```

**FIFO queues:** When emitting to a topic that has a FIFO queue subscriber, you **must** include `messageGroupId`. Messages with the same `messageGroupId` are processed sequentially. Different groups are processed in parallel.

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

👉 [Learn more about Observability →](/docs/development-guide/observability)

---

### state

Persistent key-value storage shared across Steps.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
// Store data
await state.set('users', 'user-123', { name: 'Alice', email: 'alice@example.com' })

// Retrieve data
const user = await state.get<User>('users', 'user-123')

// Get all items in a group
const allUsers = await state.getGroup<User>('users')

// Delete an item
await state.delete('users', 'user-123')

// Clear entire group
await state.clear('users')
```

</Tab>
<Tab value='JavaScript'>

```javascript
// Store data
await state.set('users', 'user-123', { name: 'Alice', email: 'alice@example.com' })

// Retrieve data
const user = await state.get('users', 'user-123')

// Get all items in a group
const allUsers = await state.getGroup('users')

// Delete an item
await state.delete('users', 'user-123')

// Clear entire group
await state.clear('users')
```

</Tab>
<Tab value='Python'>

```python
# Store data
await context.state.set("users", "user-123", {"name": "Alice", "email": "alice@example.com"})

# Retrieve data
user = await context.state.get("users", "user-123")

# Get all items in a group
all_users = await context.state.get_group("users")

# Delete an item
await context.state.delete("users", "user-123")

# Clear entire group
await context.state.clear("users")
```

</Tab>
</Tabs>

**Methods:**

- `get(groupId, key)` - Returns the value or `null`
- `set(groupId, key, value)` - Stores and returns the value
- `delete(groupId, key)` - Removes and returns the value (or `null`)
- `getGroup(groupId)` - Returns array of all values in the group
- `clear(groupId)` - Removes all items in the group

👉 [Learn more about State →](/docs/development-guide/state-management)

---

### streams

Real-time data channels for pushing updates to connected clients.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
// Set a stream item (create or update)
await streams.chatMessages.set('room-123', 'msg-456', {
  text: 'Hello!',
  author: 'Alice',
  timestamp: new Date().toISOString()
})

// Get a specific item
const message = await streams.chatMessages.get('room-123', 'msg-456')

// Get all items in a group
const messages = await streams.chatMessages.getGroup('room-123')

// Delete an item
await streams.chatMessages.delete('room-123', 'msg-456')

// Send ephemeral event (doesn't create an item)
await streams.chatMessages.send(
  { groupId: 'room-123' },
  { type: 'user.typing', data: { userId: 'alice' } }
)
```

</Tab>
<Tab value='JavaScript'>

```javascript
// Set a stream item (create or update)
await streams.chatMessages.set('room-123', 'msg-456', {
  text: 'Hello!',
  author: 'Alice',
  timestamp: new Date().toISOString()
})

// Get a specific item
const message = await streams.chatMessages.get('room-123', 'msg-456')

// Get all items in a group
const messages = await streams.chatMessages.getGroup('room-123')

// Delete an item
await streams.chatMessages.delete('room-123', 'msg-456')

// Send ephemeral event (doesn't create an item)
await streams.chatMessages.send(
  { groupId: 'room-123' },
  { type: 'user.typing', data: { userId: 'alice' } }
)
```

</Tab>
<Tab value='Python'>

```python
# Set a stream item (create or update)
await context.streams.chatMessages.set("room-123", "msg-456", {
    "text": "Hello!",
    "author": "Alice",
    "timestamp": datetime.now().isoformat()
})

# Get a specific item
message = await context.streams.chatMessages.get("room-123", "msg-456")

# Get all items in a group
messages = await context.streams.chatMessages.getGroup("room-123")

# Delete an item
await context.streams.chatMessages.delete("room-123", "msg-456")

# Send ephemeral event (doesn't create an item)
await context.streams.chatMessages.send(
    {"groupId": "room-123"},
    {"type": "user.typing", "data": {"user_id": "alice"}}
)
```

</Tab>
</Tabs>

**Methods:**

- `set(groupId, id, data)` - Create or update an item (returns the full item with metadata)
- `get(groupId, id)` - Retrieve an item or `null`
- `getGroup(groupId)` - Get all items in a group
- `delete(groupId, id)` - Remove an item
- `send(channel, event)` - Send an ephemeral event (e.g., typing indicators, reactions)

👉 [Learn more about Streams →](/docs/development-guide/streams)

---

### traceId

Unique ID for tracking requests across Steps.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
export const handler: Handlers['MyStep'] = async (req, { traceId, logger }) => {
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

## Handlers

Handlers are the functions that execute your business logic. The signature depends on the Step type.

### API Step Handler

Receives a request, returns a response.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { Handlers } from 'motia'

export const handler: Handlers['CreateUser'] = async (req, ctx) => {
  const { name, email } = req.body
  const userId = crypto.randomUUID()
  
  await ctx.emit({
    topic: 'user.created',
    data: { userId, email }
  })
  
  return {
    status: 201,
    body: { id: userId, name, email },
    headers: { 'X-Request-ID': ctx.traceId }  // Optional
  }
}
```

**Parameters:**
- `req` - Request object (see below)
- `ctx` - Context object with `emit`, `logger`, `state`, `streams`, `traceId`

**Returns:** `{ status, body, headers? }`

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (req, ctx) => {
  const { name, email } = req.body
  const userId = crypto.randomUUID()
  
  await ctx.emit({
    topic: 'user.created',
    data: { userId, email }
  })
  
  return {
    status: 201,
    body: { id: userId, name, email },
    headers: { 'X-Request-ID': ctx.traceId }  // Optional
  }
}
```

**Parameters:**
- `req` - Request object (see below)
- `ctx` - Context object with `emit`, `logger`, `state`, `streams`, `traceId`

**Returns:** `{ status, body, headers? }`

</Tab>
<Tab value='Python'>

```python
import uuid

async def handler(req, context):
    name = req.get("body", {}).get("name")
    email = req.get("body", {}).get("email")
    user_id = str(uuid.uuid4())
    
    await context.emit({
        "topic": "user.created",
        "data": {"user_id": user_id, "email": email}
    })
    
    return {
        "status": 201,
        "body": {"id": user_id, "name": name, "email": email},
        "headers": {"X-Request-ID": context.trace_id}  # Optional
    }
```

**Parameters:**
- `req` - Dictionary with `body`, `headers`, `pathParams`, `queryParams`
- `context` - Context object with `emit`, `logger`, `state`, `streams`, `trace_id`

**Returns:** `{"status": int, "body": dict, "headers": dict}`

</Tab>
</Tabs>

---

### Event Step Handler

Receives event data, processes it. No return value.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { Handlers } from 'motia'

export const handler: Handlers['ProcessOrder'] = async (input, ctx) => {
  const { orderId, amount } = input
  
  ctx.logger.info('Processing order', { orderId, amount })
  
  await ctx.state.set('orders', orderId, { 
    id: orderId, 
    amount, 
    status: 'processed' 
  })
  
  await ctx.emit({
    topic: 'order.processed',
    data: { orderId }
  })
}
```

**Parameters:**
- `input` - Event data (matches the `input` schema in config)
- `ctx` - Context object with `emit`, `logger`, `state`, `streams`, `traceId`

**Returns:** Nothing (void/None)

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (input, ctx) => {
  const { orderId, amount } = input
  
  ctx.logger.info('Processing order', { orderId, amount })
  
  await ctx.state.set('orders', orderId, { 
    id: orderId, 
    amount, 
    status: 'processed' 
  })
  
  await ctx.emit({
    topic: 'order.processed',
    data: { orderId }
  })
}
```

**Parameters:**
- `input` - Event data (matches the `input` schema in config)
- `ctx` - Context object with `emit`, `logger`, `state`, `streams`, `traceId`

**Returns:** Nothing (void/None)

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
    
    await context.emit({
        "topic": "order.processed",
        "data": {"order_id": order_id}
    })
```

**Parameters:**
- `input_data` - Event data (matches the `input` schema in config)
- `context` - Context object with `emit`, `logger`, `state`, `streams`, `trace_id`

**Returns:** Nothing (None)

</Tab>
</Tabs>

---

### Cron Step Handler

Runs on a schedule. Only receives context.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { Handlers } from 'motia'

export const handler: Handlers['DailyCleanup'] = async (ctx) => {
  ctx.logger.info('Running daily cleanup')
  
  const oldOrders = await ctx.state.getGroup('orders')
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
  
  for (const order of oldOrders) {
    if (order.createdAt < cutoff) {
      await ctx.state.delete('orders', order.id)
    }
  }
}
```

**Parameters:**
- `ctx` - Context object with `emit`, `logger`, `state`, `streams`, `traceId`

**Returns:** Nothing (void/None)

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (ctx) => {
  ctx.logger.info('Running daily cleanup')
  
  const oldOrders = await ctx.state.getGroup('orders')
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
  
  for (const order of oldOrders) {
    if (order.createdAt < cutoff) {
      await ctx.state.delete('orders', order.id)
    }
  }
}
```

**Parameters:**
- `ctx` - Context object with `emit`, `logger`, `state`, `streams`, `traceId`

**Returns:** Nothing (void/None)

</Tab>
<Tab value='Python'>

```python
from datetime import datetime, timedelta

async def handler(context):
    context.logger.info("Running daily cleanup")
    
    old_orders = await context.state.get_group("orders")
    cutoff = (datetime.now() - timedelta(days=30)).timestamp()
    
    for order in old_orders:
        if order.get("created_at") < cutoff:
            await context.state.delete("orders", order.get("id"))
```

**Parameters:**
- `context` - Context object with `emit`, `logger`, `state`, `streams`, `trace_id`

**Returns:** Nothing (None)

</Tab>
</Tabs>

---

### Middleware

Intercepts API requests before and after the handler.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
import { ApiMiddleware } from 'motia'

export const authMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const token = req.headers.authorization
  
  if (!token) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }
  
  // Verify token, attach user to request...
  
  return await next()  // Continue to next middleware or handler
}
```

**Parameters:**
- `req` - Request object
- `ctx` - Context object  
- `next` - Function to call the next middleware/handler

**Returns:** Response object

</Tab>
<Tab value='JavaScript'>

```javascript
const authMiddleware = async (req, ctx, next) => {
  const token = req.headers.authorization
  
  if (!token) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }
  
  // Verify token, attach user to request...
  
  return await next()  // Continue to next middleware or handler
}
```

**Parameters:**
- `req` - Request object
- `ctx` - Context object  
- `next` - Function to call the next middleware/handler

**Returns:** Response object

</Tab>
<Tab value='Python'>

```python
async def auth_middleware(req, context, next_fn):
    token = req.get("headers", {}).get("authorization")
    
    if not token:
        return {"status": 401, "body": {"error": "Unauthorized"}}
    
    # Verify token, attach user to request...
    
    return await next_fn()  # Continue to next middleware or handler
```

**Parameters:**
- `req` - Request dictionary
- `context` - Context object
- `next_fn` - Function to call the next middleware/handler

**Returns:** Response dictionary

</Tab>
</Tabs>

👉 [Learn more about Middleware →](/docs/development-guide/middleware)

---

## Request Object

API handlers receive a request object with these fields.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
export const handler: Handlers['GetUser'] = async (req, ctx) => {
  // Path parameters (from /users/:id)
  const userId = req.pathParams.id
  
  // Query parameters (?page=1&limit=10)
  const page = req.queryParams.page  // string or string[]
  const limit = req.queryParams.limit
  
  // Request body
  const { name, email } = req.body
  
  // Headers
  const auth = req.headers.authorization
  const userAgent = req.headers['user-agent']
  
  return { status: 200, body: { userId, name } }
}
```

**Fields:**
- `pathParams` - Object with path parameters (e.g., `:id` from `/users/:id`)
- `queryParams` - Object with query string params (values can be string or array)
- `body` - Parsed request body (validated against `bodySchema` if defined)
- `headers` - Object with request headers (values can be string or array)

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (req, ctx) => {
  // Path parameters (from /users/:id)
  const userId = req.pathParams.id
  
  // Query parameters (?page=1&limit=10)
  const page = req.queryParams.page  // string or string[]
  const limit = req.queryParams.limit
  
  // Request body
  const { name, email } = req.body
  
  // Headers
  const auth = req.headers.authorization
  const userAgent = req.headers['user-agent']
  
  return { status: 200, body: { userId, name } }
}
```

**Fields:**
- `pathParams` - Object with path parameters (e.g., `:id` from `/users/:id`)
- `queryParams` - Object with query string params (values can be string or array)
- `body` - Parsed request body (validated against `bodySchema` if defined)
- `headers` - Object with request headers (values can be string or array)

</Tab>
<Tab value='Python'>

```python
async def handler(req, context):
    # Path parameters (from /users/:id)
    user_id = req.get("pathParams", {}).get("id")
    
    # Query parameters (?page=1&limit=10)
    page = req.get("queryParams", {}).get("page")  # str or list[str]
    limit = req.get("queryParams", {}).get("limit")
    
    # Request body
    body = req.get("body", {})
    name = body.get("name")
    email = body.get("email")
    
    # Headers
    auth = req.get("headers", {}).get("authorization")
    user_agent = req.get("headers", {}).get("user-agent")
    
    return {"status": 200, "body": {"user_id": user_id, "name": name}}
```

**Fields:**
- `pathParams` - Dictionary with path parameters
- `queryParams` - Dictionary with query params (values can be str or list)
- `body` - Dictionary with parsed request body
- `headers` - Dictionary with request headers (values can be str or list)

</Tab>
</Tabs>

---

## Response Object

API handlers must return an object with these fields.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
return {
  status: 200,  // Required: HTTP status code
  body: { id: '123', name: 'Alice' },  // Required: response data
  headers: {  // Optional: custom response headers
    'Cache-Control': 'max-age=3600',
    'X-Custom-Header': 'value'
  }
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
return {
  status: 200,  // Required: HTTP status code
  body: { id: '123', name: 'Alice' },  // Required: response data
  headers: {  // Optional: custom response headers
    'Cache-Control': 'max-age=3600',
    'X-Custom-Header': 'value'
  }
}
```

</Tab>
<Tab value='Python'>

```python
return {
    "status": 200,  # Required: HTTP status code
    "body": {"id": "123", "name": "Alice"},  # Required: response data
    "headers": {  # Optional: custom response headers
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

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript title="steps/chat-messages.stream.ts"
import { StreamConfig } from 'motia'
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

```javascript title="steps/chat-messages.stream.js"
const { z } = require('zod')

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

```python title="steps/chat_messages_stream.py"
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

File naming:
- TypeScript/JavaScript: `*.stream.ts` or `*.stream.js`
- Python: `*_stream.py`

---

## CLI Commands

Motia's command-line tools for development and deployment.

### `motia version`

Show Motia CLI version.

```bash
motia version
motia -V
motia --version
```

---

### `motia create`

Create a new Motia project.

```bash
npx motia create my-app
npx motia create .  # Use current directory
npx motia create --template python my-python-app
```

**Options:**
- `[name]` - Project name (or `.` for current directory)
- `-t, --template <name>` - Template to use (`nodejs` or `python`)
- `-c, --cursor` - Add Cursor IDE rules

---

### `motia rules pull`

Install AI development guides (AGENTS.md, CLAUDE.md) and Cursor IDE rules.

```bash
motia rules pull
motia rules pull --force  # Overwrite existing files
```

**Options:**
- `-f, --force` - Overwrite existing files

---

### `motia dev`

Start development server with Workbench and hot reload.

```bash
npm run dev
# or
motia dev --port 4000 --host 0.0.0.0
```

**Options:**
- `-p, --port <number>` - Port number (default: 3000)
- `-H, --host <address>` - Host address (default: localhost)
- `-d, --debug` - Enable debug logging
- `-m, --mermaid` - Generate Mermaid diagrams
- `--motia-dir <path>` - Custom path for `.motia` folder

---

### `motia start`

Start production server (no Workbench, no hot reload).

```bash
motia start
motia start --port 8080 --host 0.0.0.0
```

**Options:**
- `-p, --port <number>` - Port number (default: 3000)
- `-H, --host <address>` - Host address (default: localhost)
- `-d, --debug` - Enable debug logging
- `--motia-dir <path>` - Custom path for `.motia` folder

---

### `motia build`

Build your project for deployment.

```bash
motia build
```

Compiles all Steps and generates deployment artifacts.

---

### `motia generate-types`

Generate TypeScript types from your Step configs.

```bash
motia generate-types
```

Creates `types.d.ts` with type-safe `Handlers` interface. Run this after changing Step configs.

---

### `motia generate step`

Create a new Step interactively.

```bash
motia generate step
motia generate step --dir users/create-user
```

**Options:**
- `-d, --dir <path>` - Path relative to `steps/` directory

---

### `motia generate openapi`

Generate OpenAPI specification.

```bash
motia generate openapi
motia generate openapi --output api-spec.json --title "My API"
```

**Options:**
- `-t, --title <title>` - API title (default: package.json name)
- `-v, --version <version>` - API version (default: 1.0.0)
- `-o, --output <file>` - Output file (default: openapi.json)

---

### `motia install`

Set up Python virtual environment and install dependencies.

```bash
motia install
npm run dev  # Auto-runs motia install via postinstall hook
```

---

### `motia emit`

Manually emit an event (for testing).

```bash
motia emit --topic user.created --message '{"userId":"123"}'
motia emit --topic order.created --message '{"orderId":"456"}' --port 3000
```

**Options:**
- `--topic <topic>` - Event topic name
- `--message <json>` - Event data as JSON string
- `-p, --port <number>` - Server port (default: 3000)

---

### `motia docker setup`

Generate Dockerfile and .dockerignore.

```bash
motia docker setup
```

---

### `motia docker build`

Build Docker image.

```bash
motia docker build
motia docker build --project-name my-app
```

---

### `motia docker run`

Build and run Docker container.

```bash
motia docker run
motia docker run --port 8080 --skip-build
```

**Options:**
- `-p, --port <number>` - Host port to map (default: 3000)
- `-n, --project-name <name>` - Docker image name
- `-s, --skip-build` - Skip building the image

---

### `motia cloud deploy`

Deploy to Motia Cloud.

```bash
motia cloud deploy -k YOUR_API_KEY -v v1.0.0
motia cloud deploy --api-key YOUR_API_KEY --version-name v1.2.0 --environment-name production
```

**Options:**
- `-k, --api-key <key>` - Motia Cloud API key (or set `MOTIA_API_KEY` env var)
- `-v, --version-name <version>` - Version name/tag for this deployment
- `-n, --project-name <name>` - Project name (for new projects)
- `-s, --environment-id <id>` - Environment ID
- `--environment-name <name>` - Environment name
- `-e, --env-file <path>` - Path to environment variables file
- `-d, --version-description <desc>` - Version description
- `-c, --ci` - CI mode (non-interactive)

---

## Common Patterns

### Emit Types

You can emit topics as strings or objects with labels.

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
<Tab value='TypeScript'>

```typescript
// Simple emit
emits: ['user.created', 'email.sent']

// With labels and conditional flags
emits: [
  { topic: 'order.approved', label: 'Auto-approved' },
  { topic: 'order.rejected', label: 'Requires review', conditional: true }
]
```

</Tab>
<Tab value='JavaScript'>

```javascript
// Simple emit
emits: ['user.created', 'email.sent']

// With labels and conditional flags
emits: [
  { topic: 'order.approved', label: 'Auto-approved' },
  { topic: 'order.rejected', label: 'Requires review', conditional: true }
]
```

</Tab>
<Tab value='Python'>

```python
# Simple emit
"emits": ["user.created", "email.sent"]

# With labels and conditional flags
"emits": [
    {"topic": "order.approved", "label": "Auto-approved"},
    {"topic": "order.rejected", "label": "Requires review", "conditional": True}
]
```

</Tab>
</Tabs>

The `label` and `conditional` fields are for Workbench visualization only. They don't affect execution.

---

### Query Parameters

Document query params for Workbench.

```typescript
queryParams: [
  { name: 'page', description: 'Page number for pagination' },
  { name: 'limit', description: 'Number of items per page' },
  { name: 'sort', description: 'Sort field (e.g., createdAt, name)' }
]
```

This shows up in the Workbench endpoint tester.

---

### Include Files

Bundle files with your Step (useful for templates, assets, binaries).

```typescript
// Relative to the Step file
includeFiles: [
  './templates/email.html',
  './assets/*.png',
  '../../lib/stockfish'
]
```

Files are copied into the deployment bundle and accessible at runtime.

---

## Adapter Interfaces

Adapter interfaces define contracts for pluggable infrastructure components. Implement these interfaces to create custom adapters for state, streams, events, and cron.

<Callout type="info">
Adapter creation is only supported in TypeScript/JavaScript. Python steps can use adapters configured in `motia.config.ts`, but cannot create custom adapters.
</Callout>

### StateAdapter

Interface for state storage adapters.

```typescript
interface StateAdapter extends InternalStateManager {
  // From InternalStateManager
  get<T>(traceId: string, key: string): Promise<T | null>
  set<T>(traceId: string, key: string, value: T): Promise<T>
  delete<T>(traceId: string, key: string): Promise<T | null>
  getGroup<T>(traceId: string): Promise<T[]>
  clear(traceId: string): Promise<void>

  // Additional StateAdapter methods
  cleanup(): Promise<void>
  keys(traceId: string): Promise<string[]>
  traceIds(): Promise<string[]>
  items(input: StateItemsInput): Promise<StateItem[]>
}
```

### StreamAdapter

Abstract class for stream adapters.

```typescript
abstract class StreamAdapter<TData> {
  constructor(streamName: string)

  // Required methods
  abstract get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  abstract set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>>
  abstract delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  abstract getGroup(groupId: string): Promise<BaseStreamItem<TData>[]>

  // Optional methods (with defaults)
  send(channel: StreamChannel, event: StreamEvent): Promise<void>
  subscribe(channel: StreamChannel, handler: StreamEventHandler): Promise<void>
  unsubscribe(channel: StreamChannel): Promise<void>
  clear(groupId: string): Promise<void>
  query(groupId: string, filter: StreamFilter): Promise<BaseStreamItem<TData>[]>
}
```

### EventAdapter

Interface for event handling adapters.

```typescript
interface EventAdapter {
  emit<TData>(event: Event<TData>): Promise<void>
  subscribe<TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: QueueConfig,
  ): Promise<SubscriptionHandle>
  unsubscribe(handle: SubscriptionHandle): Promise<void>
  shutdown(): Promise<void>
  getSubscriptionCount(topic: string): Promise<number>
  listTopics(): Promise<string[]>
}
```

### CronAdapter

Interface for cron job locking adapters.

```typescript
interface CronAdapter {
  acquireLock(jobName: string, ttl: number): Promise<CronLock | null>
  releaseLock(lock: CronLock): Promise<void>
  renewLock(lock: CronLock, ttl: number): Promise<boolean>
  isHealthy(): Promise<boolean>
  shutdown(): Promise<void>
  getActiveLocks(): Promise<CronLockInfo[]>
}
```

### Supporting Types

```typescript
interface Event<TData> {
  topic: string
  data: TData
  timestamp?: number
  traceId?: string
}

interface SubscriptionHandle {
  topic: string
  id: string
  unsubscribe: () => Promise<void>
}

interface CronLock {
  jobName: string
  lockId: string
  acquiredAt: number
  expiresAt: number
  instanceId: string
}

interface CronLockInfo {
  jobName: string
  instanceId: string
  acquiredAt: number
  expiresAt: number
}

interface StateItem {
  groupId: string
  key: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  value: unknown
}

interface StateItemsInput {
  groupId?: string
  traceId?: string
}
```

[Learn more about creating adapters →](/docs/development-guide/adapters/creating-adapters)

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
