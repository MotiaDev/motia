---
title: What is a Step?
description: One primitive to build any backend. Powerful, reusable, multi-language, composable, and auto-discovered.
---

# What is a Step?

## One Step to build any backend.

**Powerful. Reusable. Multi-Language. Composable. Auto-Discovered.**

Steps are Motia's core primitive that unifies configuration and logic, allowing you to define when it runs, how it runs, where it runs, and what it does, all within a single abstraction.

Learn the basic things about how Steps work, and Motia will auto-discover, register, and connect any file with `.step.ts`, `.step.js`, and `_step.py`.  By composing Steps, you can build entire backends in any pattern and runtime.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript title="steps/my-step.step.ts"
import { ApiRouteConfig, Handlers } from 'motia';

export const config: ApiRouteConfig = {
  name: 'MyStep',     // Step identifier  
  type: 'api',        // How it triggers
  path: '/endpoint',  // URL path
  method: 'POST',     // POST method
  emits: ['done'],    // Events it sends
  flows: ['my-flow']  // Flow it belongs to
};

export const handler: Handlers['MyStep'] = async (req, { emit, logger, state, streams }) => {
  // Your business logic here
  return { status: 200, body: { success: true } };
};
```

</Tab>
<Tab value='Python'>

```python title="steps/my_step.py"
config = {
    "name": "MyStep",     # Step identifier
    "type": "api",        # How it triggers
    "path": "/endpoint",  # URL path
    "method": "POST",     # POST method
    "emits": ["done"],    # Events it sends
    "flows": ["my-flow"]  # Flow it belongs to
}

async def handler(req, context):
    # Your business logic here
    return {"status": 200, "body": {"success": True}}
```

</Tab>
<Tab value='JavaScript'>

```javascript title="steps/my-step.step.js"
const config = {
  name: 'MyStep',     // Step identifier  
  type: 'api',        // How it triggers
  path: '/endpoint',  //  path
  method: 'POST',     // POST method
  emits: ['done'],    // Events it sends
  flows: ['my-flow']  // Flow it belongs to
};

const handler = async (req, { emit, logger, state, streams }) => {
  // Your business logic here
  return { status: 200, body: { success: true } };
};

module.exports = { config, handler };
```

</Tab>
</Tabs>

## Config Properties

### Common Properties (All Step Types)

| Property | Type | Description |
| -------- | ---- | ----------- |
| `name` | `string` | Unique identifier for the step used in handler typing |
| `type` | `'api' \| 'event' \| 'cron' \| 'noop'` | The trigger type - determines how and when the step executes |
| `description` | `string` | Human-readable documentation for the step |
| `emits` | `string[]` | Array of event topics this step can emit to trigger other steps |
| `flows` | `string[]` | Array of flow names this step belongs to for organization and visualization |

### API Trigger Step Properties

Additional properties when `type: 'api'`. [See API Trigger examples below](#api-trigger---http-requests).

| Property | Type | Description |
| -------- | ---- | ----------- |
| `path` | `string` | URL endpoint path (e.g., `/messages`, `/users/:id`) |
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'DELETE' \| 'PATCH'` | HTTP method for the endpoint |
| `bodySchema` | `ZodSchema \| JSONSchema` | Validation schema for request body |
| `responseSchema` | `{ [status]: ZodSchema }` | Response schemas by HTTP status code |
| `queryParams` | `string[]` | Array of allowed query parameter names |
| `virtualSubscribes` | `string[]` | Virtual event subscriptions for API routing |

### Event Trigger Step Properties

Additional properties when `type: 'event'`. [See Event Trigger examples below](#event-trigger---event-driven).

| Property | Type | Description |
| -------- | ---- | ----------- |
| `subscribes` | `string[]` | Array of event topics this step listens to |
| `input` | `ZodSchema \| JSONSchema` | Validation schema for incoming event data |

### Cron Trigger Step Properties

Additional properties when `type: 'cron'`. [See Cron Trigger examples below](#cron-trigger---time-based).

| Property | Type | Description |
| -------- | ---- | ----------- |
| `cron` | `string` | Cron expression for scheduling (e.g., `'0 9 * * *'` for daily at 9 AM) |

## Handler Definition

The handler is the core function where your business logic resides. The function signature varies based on the trigger type:

### Handler Signatures by Trigger Type

<Tabs items={['API Triggers', 'Event Triggers', 'Cron Triggers']}>
<Tab value='API Triggers'>

**API Triggers** receive HTTP request data as the first parameter:

```typescript
export const handler: Handlers['StepName'] = async (req, ctx) => {
  // req contains: body, query, params, headers, method, path
  // ctx contains: emit, logger, state, streams, traceId
}
```

</Tab>
<Tab value='Event Triggers'>

**Event Triggers** receive event input data as the first parameter:

```typescript
export const handler: Handlers['StepName'] = async (input, ctx) => {
  // input contains the event data matching the input schema
  // ctx contains: emit, logger, state, streams, traceId
}
```

</Tab>
<Tab value='Cron Triggers'>

**Cron Triggers** only receive the context object (no input parameter):

```typescript
export const handler: Handlers['StepName'] = async (ctx) => {
  // ctx contains: emit, logger, state, streams, traceId
}
```

</Tab>
</Tabs>

### Context Object (`ctx`) Elements

All handlers receive a context object containing these essential elements:

| Element | Type | Description |
| ------- | ---- | ----------- |
| `emit` | `function` | Function to trigger other steps by emitting events with data |
| `logger` | `object` | Structured logging with context (`ctx.logger.info()`, `ctx.logger.error()`) |
| `state` | `object` | Persistent key-value storage shared across steps (`ctx.state.set()`, `ctx.state.get()`) |
| `streams` | `object` | Real-time data streams for live updates (`ctx.streams.streamName.set()`) |
| `traceId` | `string` | Unique identifier for request tracing and workflow isolation |

### Request Object (`req`) - API Triggers Only

For API triggers, the first parameter contains HTTP request information:

| Property | Type | Description |
| -------- | ---- | ----------- |
| `body` | `object` | Parsed request body (validated against `bodySchema`) |
| `query` | `object` | URL query parameters as key-value pairs |
| `params` | `object` | URL path parameters (e.g., `/users/:id` → `{id: "123"}`) |
| `headers` | `object` | HTTP request headers |
| `method` | `string` | HTTP method (`GET`, `POST`, etc.) |
| `path` | `string` | Request URL path |

### Input Data (`input`) - Event Triggers Only

For event triggers, the first parameter contains the event data that was emitted by other steps, validated against the `input` schema if defined.

## Step is Simple, but powerful. Let's see an example.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript title="steps/my-step.step.ts"
import { ApiRouteConfig, Handlers } from 'motia';

export const config: ApiRouteConfig = {
  name: 'MyStep',     // Step identifier  
  type: 'api',        // How it triggers
  path: '/endpoint',  // URL path
  method: 'POST',     // POST method
  emits: ['done'],    // Events it sends
  flows: ['my-flow']  // Flow it belongs to
};

export const handler: Handlers['MyStep'] = async (req, { emit, logger, state, streams }) => {
  // Your business logic here
  return { status: 200, body: { success: true } };
};
```

</Tab>
<Tab value='Python'>

```python title="steps/my_step.py"
config = {
    "name": "MyStep",     # Step identifier
    "type": "api",        # How it triggers
    "path": "/endpoint",  # URL path
    "method": "POST",     # POST method
    "emits": ["done"],    # Events it sends
    "flows": ["my-flow"]  # Flow it belongs to
}

async def handler(req, context):
    # Your business logic here
    return {"status": 200, "body": {"success": True}}
```

</Tab>
<Tab value='JavaScript'>

```javascript title="steps/my-step.step.js"
const config = {
  name: 'MyStep',     // Step identifier  
  type: 'api',        // How it triggers
  path: '/endpoint',  //  path
  method: 'POST',     // POST method
  emits: ['done'],    // Events it sends
  flows: ['my-flow']  // Flow it belongs to
};

const handler = async (req, { emit, logger, state, streams }) => {
  // Your business logic here
  return { status: 200, body: { success: true } };
};

module.exports = { config, handler };
```

</Tab>
</Tabs>

<Callout type="info">
### You can simply change the type to 'api', 'event', or 'cron' to create different trigger types for your steps.
</Callout>

## API Trigger Step

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
export const config: ApiRouteConfig = {
  name: 'SendMessage',
  type: 'api',           // ← How it triggers
  path: '/messages',     // ←  path
  method: 'POST',        // ←  method
  emits: ['message.sent'],
  flows: ['messaging']
};
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "SendMessage",
    "type": "api",           # ← How it triggers
    "path": "/messages",     # ←  path
    "method": "POST",        # ←  method
    "emits": ["message.sent"],
    "flows": ["messaging"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'SendMessage',
  type: 'api',           // ← How it triggers
  path: '/messages',     // ←  path
  method: 'POST',        // ←  method
  emits: ['message.sent'],
  flows: ['messaging']
};
```

</Tab>
</Tabs>

## Event Trigger Step

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
export const config: EventConfig = {
  name: 'ProcessMessage',
  type: 'event',                // ← Event-driven
  subscribes: ['message.sent'], // ← Listen to events
  emits: ['message.processed'],
  flows: ['messaging']
};
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "ProcessMessage",
    "type": "event",                # ← Event-driven
    "subscribes": ["message.sent"], # ← Listen to events
    "emits": ["message.processed"],
    "flows": ["messaging"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'ProcessMessage',
  type: 'event',                // ← Event-driven
  subscribes: ['message.sent'], // ← Listen to events
  emits: ['message.processed'],
  flows: ['messaging']
};
```

</Tab>
</Tabs>

## Cron Trigger Step

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
export const config: CronConfig = {
  name: 'DailySummary',
  type: 'cron',                 // ← Time-based
  cron: '0 9 * * *',            // ← Schedule
  emits: ['summary.generated'],
  flows: ['messaging']
};
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "DailySummary",
    "type": "cron",                 # ← Time-based
    "cron": "0 9 * * *",            # ← Schedule
    "emits": ["summary.generated"],
    "flows": ["messaging"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'DailySummary',
  type: 'cron',                 // ← Time-based
  cron: '0 9 * * *',            // ← Schedule
  emits: ['summary.generated'],
  flows: ['messaging']
};
```

</Tab>
</Tabs>

**Same pattern, different triggers.** The handler always gets `{ emit, logger, state, streams, traceId }`.

## **Handler** - How It Performs Logic
The core function that processes data and performs your business logic.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
export const handler: Handlers['MyStep'] = async (req, { emit, logger, state, streams, traceId }) => {
  // write your business logic here
  return { status: 200, body: { success: true, result } };
};
```

</Tab>
<Tab value='Python'>

```python
async def handler(req, context):
    # write your business logic here
    return {"status": 200, "body": {"success": True, "result": {}}}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const handler = async (req, { emit, logger, state, streams, traceId }) => {
  // write your business logic here
  return { status: 200, body: { success: true, result } };
};
```

</Tab>
</Tabs>

## **subscribe** - Receive Input Data
How your step receives and accesses input data.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
export const config: EventConfig = {
  name: 'EventStep',
  type: 'event',
  subscribes: ['message.sent'],            // ← Subscribe to events
  // input schema defines what data to expect
};
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "EventStep",
    "type": "event",
    "subscribes": ["message.sent"],        # ← Subscribe to events
    # input schema defines what data to expect
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'EventStep',
  type: 'event',
  subscribes: ['message.sent'],            // ← Subscribe to events
  // input schema defines what data to expect
};
```

</Tab>
</Tabs>

## **emit** - Trigger Other Steps
Optionally trigger other Steps by emitting events with data.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
await emit({
  topic: 'user.created',       
  data: { userId: '123', email: 'user@example.com' }
});
```

</Tab>
<Tab value='Python'>

```python
await context.emit({
    "topic": "user.created",     
    "data": {"userId": "123", "email": "user@example.com"}
})
```

</Tab>
<Tab value='JavaScript'>

```javascript
await emit({
  topic: 'user.created',        
  data: { userId: '123', email: 'user@example.com' }
});
```

</Tab>
</Tabs>

## **logger** - Structured Logging
Structured logging with context for debugging, monitoring, and observability across all Steps.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
logger.info('Processing started', { userId: '123' });
logger.error('Process failed', { error: error.message });
logger.warn('High usage detected', { requests: 1000 });
```

</Tab>
<Tab value='Python'>

```python
context.logger.info('Processing started', {"userId": "123"})
context.logger.error('Process failed', {"error": str(error)})
context.logger.warn('High usage detected', {"requests": 1000})
```

</Tab>
<Tab value='JavaScript'>

```javascript
logger.info('Processing started', { userId: '123' });
logger.error('Process failed', { error: error.message });
logger.warn('High usage detected', { requests: 1000 });
```

</Tab>
</Tabs>

## **state** - Share Data Between Steps
Persistent key-value storage shared across Steps and workflows for data persistence.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
// Store data
await state.set(traceId, 'user-preferences', { theme: 'dark', lang: 'en' });

// Retrieve data  
const preferences = await state.get(traceId, 'user-preferences');

// Get all data in a group
const allUserData = await state.getGroup(traceId);

// Clear all data for this workflow
await state.clear(traceId);
```

</Tab>
<Tab value='Python'>

```python
# Store data
await context.state.set(context.trace_id, 'user-preferences', {"theme": "dark", "lang": "en"})

# Retrieve data
preferences = await context.state.get(context.trace_id, 'user-preferences')

# Get all data in a group
all_user_data = await context.state.get_group(context.trace_id)

# Clear all data for this workflow
await context.state.clear(context.trace_id)
```

</Tab>
<Tab value='JavaScript'>

```javascript
// Store data
await state.set(traceId, 'user-preferences', { theme: 'dark', lang: 'en' });

// Retrieve data  
const preferences = await state.get(traceId, 'user-preferences');

// Get all data in a group
const allUserData = await state.getGroup(traceId);

// Clear all data for this workflow
await state.clear(traceId);
```

</Tab>
</Tabs>

## **streams** - Real-time Objects and Events Broadcasting
Real-time objects and events that automatically push updates to subscribed clients.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
// Set/update real-time data for clients
await streams.chatMessages.set('room-123', 'msg-456', {
  text: 'Hello!',
  userId: '123',
  timestamp: new Date()
});

// Get a specific item
const message = await streams.chatMessages.get('room-123', 'msg-456');

// Get all items in a group
const allMessages = await streams.chatMessages.getGroup('room-123');

// Delete an item
await streams.chatMessages.delete('room-123', 'msg-456');
```

</Tab>
<Tab value='Python'>

```python
# Set/update real-time data for clients
await context.streams.chat_messages.set('room-123', 'msg-456', {
    "text": "Hello!",
    "userId": "123",
    "timestamp": datetime.now().isoformat()
})

# Get a specific item
message = await context.streams.chat_messages.get('room-123', 'msg-456')

# Get all items in a group
all_messages = await context.streams.chat_messages.get_group('room-123')

# Delete an item
await context.streams.chat_messages.delete('room-123', 'msg-456')
```

</Tab>
<Tab value='JavaScript'>

```javascript
// Set/update real-time data for clients
await streams.chatMessages.set('room-123', 'msg-456', {
  text: 'Hello!',
  userId: '123',
  timestamp: new Date()
});

// Get a specific item
const message = await streams.chatMessages.get('room-123', 'msg-456');

// Get all items in a group
const allMessages = await streams.chatMessages.getGroup('room-123');

// Delete an item
await streams.chatMessages.delete('room-123', 'msg-456');
```

</Tab>
</Tabs>

## What's Next?

Now that you understand how simple steps are, let's build something:

  <div className="p-4 border rounded-lg">
    <h3 className="text-lg font-semibold mb-2">🏗️ Quick Tutorial</h3>
    <p className="text-sm text-gray-600 mb-3">Build your first app with a complete step-by-step guide.</p>
    <a href="/docs/getting-started/build-your-first-app" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
      Start Tutorial →
    </a>
  </div>

Remember: **Steps are just files.** Export a `config` and `handler`, and you're done! 🎉
