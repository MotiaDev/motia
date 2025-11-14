---
title: Steps
description: One primitive to build any backend. Simple, composable, and multi-language.
---

## One Primitive for Any Backend

A **Step** is the core primitive in Motia. Instead of juggling separate frameworks for APIs, background jobs, queues, or workflows, you define everything in one place:   **how it runs, when it runs, where it runs, and what it does.**

Every Step file contains two parts:

- **Config** → defines when and how the Step runs, and gives it a unique `name`  
- **Handler** → the function that executes your business logic  

Motia automatically discovers any file ending in `.step.ts`, `.step.js`, or `_step.py`.  
The filename tells Motia to load it, and the `name` in the `config` uniquely identifies the Step inside your system.

---

## The Simplest Example

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```ts title="steps/hello.step.ts"
import { ApiRouteConfig, Handlers } from 'motia';

export const config: ApiRouteConfig = {
  name: 'HelloStep',
  type: 'api',
  path: '/hello',
  method: 'GET'
};

export const handler: Handlers['HelloStep'] = async (req, { logger }) => {
  logger.info('Hello endpoint called');
  return { status: 200, body: { message: 'Hello world!' } };
};
```

</Tab>
<Tab value='Python'>

```python title="steps/hello_step.py"
config = {
    "name": "HelloStep",
    "type": "api",
    "path": "/hello",
    "method": "GET"
}

async def handler(req, ctx):
    ctx.logger.info("Hello endpoint called")
    return {"status": 200, "body": {"message": "Hello world!"}}
```

</Tab>
<Tab value='JavaScript'>

```js title="steps/hello.step.js"
const config = {
  name: 'HelloStep',
  type: 'api',
  path: '/hello',
  method: 'GET'
};

const handler = async (req, { logger }) => {
  logger.info('Hello endpoint called');
  return { status: 200, body: { message: 'Hello world!' } };
};

module.exports = { config, handler };
```

</Tab>
</Tabs>

👉 That’s all you need to make a running API endpoint.  
Motia will auto-discover this file and wire it into your backend.

---

## Steps Work Together: Emit + Subscribe

Steps aren’t isolated. They communicate by **emitting** and **subscribing** to events.  
This is the core of how you build backends with Motia.

### Example Flow: API Step → Event Step

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```ts title="steps/send-message.step.ts"
import { ApiRouteConfig, Handlers } from 'motia';

export const config: ApiRouteConfig = {
  name: 'SendMessage',
  type: 'api',
  path: '/messages',
  method: 'POST',
  emits: ['message.sent']
};

export const handler: Handlers['SendMessage'] = async (req, { emit }) => {
  await emit({
    topic: 'message.sent',
    data: { text: req.body.text }
  });
  return { status: 200, body: { ok: true } };
};
```

```ts title="steps/process-message.step.ts"
import { EventConfig, Handlers } from 'motia';

export const config: EventConfig = {
  name: 'ProcessMessage',
  type: 'event',
  subscribes: ['message.sent']
};

export const handler: Handlers['ProcessMessage'] = async (input, { logger }) => {
  logger.info('Processing message', input);
};
```
</Tab>

<Tab value='Python'>

```python title="send_message_step.py"
config = {
    "name": "SendMessage",
    "type": "api",
    "path": "/messages",
    "method": "POST",
    "emits": ["message.sent"]
}

async def handler(req, ctx):
    await ctx.emit({
        "topic": "message.sent",
        "data": {"text": req.body["text"]}
    })
    return {"status": 200, "body": {"ok": True}}
```

```python title="process_message_step.py"
config = {
    "name": "ProcessMessage",
    "type": "event",
    "subscribes": ["message.sent"]
}

async def handler(input, ctx):
    ctx.logger.info("Processing message", input)
```
</Tab>

<Tab value='JavaScript'>

```js title="steps/send-message.step.js"
const config = {
  name: 'SendMessage',
  type: 'api',
  path: '/messages',
  method: 'POST',
  emits: ['message.sent']
};

const handler = async (req, { emit }) => {
  await emit({
    topic: 'message.sent',
    data: { text: req.body.text }
  });
  return { status: 200, body: { ok: true } };
};

module.exports = { config, handler };
```

```js title="steps/process-message.step.js"
const config = {
  name: 'ProcessMessage',
  type: 'event',
  subscribes: ['message.sent']
};

const handler = async (input, { logger }) => {
  logger.info('Processing message', input);
};

module.exports = { config, handler };
```
</Tab>
</Tabs>

👉 With just two files, you have an **API endpoint** that triggers an **event-driven workflow**.  

---

## Triggers

<div id="triggers-api"></div>
<div id="triggers-event"></div>
<div id="triggers-cron"></div>

Every Step has a `type` that defines **how it triggers**:

| Type | When it runs | Use case |
|------|--------------|----------|
| `api` | HTTP request | REST APIs, webhooks |
| `event` | Event emitted | Background jobs, workflows |
| `cron` | Schedule | Cleanup, reports, reminders |

<Tabs items={['API', 'Event', 'Cron']} groupId="triggers" updateAnchor defaultIndex={0}>
  <Tab id="triggers-api" value="API">

### API Trigger

Runs when an HTTP request hits the path.

**Example:**

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
  <Tab value="TypeScript">
    ```typescript
    import { ApiRouteConfig, Handlers } from 'motia'

    export const config: ApiRouteConfig = {
      name: 'GetUser',
      type: 'api',
      path: '/users/:id',
      method: 'GET'
    }

    export const handler: Handlers['GetUser'] = async (req, { logger }) => {
      const userId = req.pathParams.id
      logger.info('Getting user', { userId })
      return { status: 200, body: { id: userId, name: 'John' } }
    }
    ```
  </Tab>
  <Tab value="JavaScript">
    ```javascript
    const config = {
      name: 'GetUser',
      type: 'api',
      path: '/users/:id',
      method: 'GET'
    }

    const handler = async (req, { logger }) => {
      const userId = req.pathParams.id
      logger.info('Getting user', { userId })
      return { status: 200, body: { id: userId, name: 'John' } }
    }

    module.exports = { config, handler }
    ```
  </Tab>
  <Tab value="Python">
    ```python
    config = {
        "name": "GetUser",
        "type": "api",
        "path": "/users/:id",
        "method": "GET"
    }

    async def handler(req, ctx):
        user_id = req.get("pathParams", {}).get("id")
        ctx.logger.info("Getting user", {"userId": user_id})
        return {"status": 200, "body": {"id": user_id, "name": "John"}}
    ```
  </Tab>
</Tabs>

**Config:**

| Property | Description |
|----------|-------------|
| `name` | Unique identifier |
| `type` | Set to `'api'` |
| `path` | URL path (supports `:params`) |
| `method` | GET, POST, PUT, DELETE |
| `bodySchema` | Validate request body |

**Handler:** `handler(req, ctx)`

- `req` - Request with `body`, `headers`, `pathParams`, `queryParams`
- `ctx` - Context with `logger`, `emit`, `state`, `streams`, `traceId`
- Returns `{ status, body, headers? }`

</Tab>

  <Tab id="triggers-event" value="Event">

### Event Trigger

Runs when an event is emitted. Use for background tasks.

**Example:**

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
  <Tab value="TypeScript">
    ```typescript
    import { EventConfig, Handlers } from 'motia'

    export const config: EventConfig = {
      name: 'ProcessMessage',
      type: 'event',
      subscribes: ['message.sent'],
      emits: ['message.processed']
    }

    export const handler: Handlers['ProcessMessage'] = async (input, { logger, emit }) => {
      logger.info('Processing message:', input)
      await emit({ topic: 'message.processed', data: input })
    }
    ```
  </Tab>
  <Tab value="JavaScript">
    ```javascript
    const config = {
      name: 'ProcessMessage',
      type: 'event',
      subscribes: ['message.sent'],
      emits: ['message.processed']
    }

    const handler = async (input, { logger, emit }) => {
      logger.info('Processing message:', input)
      await emit({ topic: 'message.processed', data: input })
    }

    module.exports = { config, handler }
    ```
  </Tab>
  <Tab value="Python">
    ```python
    config = {
        "name": "ProcessMessage",
        "type": "event",
        "subscribes": ["message.sent"],
        "emits": ["message.processed"]
    }

    async def handler(input, ctx):
        ctx.logger.info("Processing message:", {"input": input})
        await ctx.emit({"topic": "message.processed", "data": input})
    ```
  </Tab>
</Tabs>

**Config:**

| Property | Description |
|----------|-------------|
| `name` | Unique identifier |
| `type` | Set to `'event'` |
| `subscribes` | Event topics to listen to |
| `emits` | Event topics to emit |
| `input` | Validate input data |

**Handler:** `handler(input, ctx)`

- `input` - Data from the emitted event
- `ctx` - Context with `logger`, `emit`, `state`, `streams`, `traceId`

</Tab>

  <Tab id="triggers-cron" value="Cron">

### Cron Trigger

Runs on a schedule. Use for periodic tasks.

**Example:**

<Tabs items={['TypeScript', 'JavaScript', 'Python']}>
  <Tab value="TypeScript">
    ```typescript
    import { CronConfig, Handlers } from 'motia'

    export const config: CronConfig = {
      name: 'DailyCleanup',
      type: 'cron',
      cron: '0 0 * * *'
    }

    export const handler: Handlers['DailyCleanup'] = async ({ logger }) => {
      logger.info('Running daily cleanup')
    }
    ```
  </Tab>
  <Tab value="JavaScript">
    ```javascript
    const config = {
      name: 'DailyCleanup',
      type: 'cron',
      cron: '0 0 * * *'
    }

    const handler = async ({ logger }) => {
      logger.info('Running daily cleanup')
    }

    module.exports = { config, handler }
    ```
  </Tab>
  <Tab value="Python">
    ```python
    config = {
        "name": "DailyCleanup",
        "type": "cron",
        "cron": "0 0 * * *"
    }
  
    async def handler(ctx):
        ctx.logger.info("Running daily cleanup")
    ```
  </Tab>
</Tabs>

**Config:**

| Property | Description |
|----------|-------------|
| `name` | Unique identifier |
| `type` | Set to `'cron'` |
| `cron` | Cron expression |

**Handler:** `handler(ctx)`

- `ctx` - Context with `logger`, `emit`, `state`, `streams`, `traceId`

**Common schedules:**

| Expression | Runs |
|------------|------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 9 * * 1` | Monday at 9 AM |

👉 Use [crontab.guru](https://crontab.guru) to build expressions.

</Tab>
</Tabs>

---

## Context Object

Every handler receives a `ctx` object with these tools:

| Property | Description |
|----------|-------------|
| `logger` | Structured logging (`info`, `warn`, `error`) |
| `emit` | Trigger other Steps by emitting events |
| `state` | Persistent key-value storage |
| `streams` | Real-time data channels for clients |
| `traceId` | Unique ID for tracing requests & workflows |

---

## Core Functionality

### State – Persistent Data

Key-value storage shared across Steps and workflows.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```ts
await state.set(traceId, 'preferences', { theme: 'dark' });
const prefs = await state.get(traceId, 'preferences');
```

</Tab>
<Tab value='Python'>

```python
await context.state.set(context.trace_id, "preferences", {"theme": "dark"})
prefs = await context.state.get(context.trace_id, "preferences")
```

</Tab>
<Tab value='JavaScript'>

```js
await state.set(traceId, 'preferences', { theme: 'dark' });
const prefs = await state.get(traceId, 'preferences');
```

</Tab>
</Tabs>

👉 [Learn more about State Management →](/docs/development-guide/state-management)

### Logging – Structured & Contextual

For debugging, monitoring, and observability.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```ts
logger.info('Processing user', { userId: '123' });
```

</Tab>
<Tab value='Python'>

```python
context.logger.info("Processing user", {"userId": "123"})
```

</Tab>
<Tab value='JavaScript'>

```js
logger.info('Processing user', { userId: '123' });
```

</Tab>
</Tabs>

👉 [Learn more about Observability →](/docs/development-guide/observability)

### Streams – Real-Time Data

Push updates directly to connected clients.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```ts
await streams.chat.set('room-123', 'msg-456', { text: 'Hello!' });
```

</Tab>
<Tab value='Python'>

```python
await context.streams.chat.set("room-123", "msg-456", {"text": "Hello!"})
```

</Tab>
<Tab value='JavaScript'>

```js
await streams.chat.set('room-123', 'msg-456', { text: 'Hello!' });
```

</Tab>
</Tabs>

👉 [Learn more about Streams →](/docs/development-guide/streams)

### Flows – Visualize in Workbench

Group Steps together for diagram visualization in Workbench.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```ts
export const config: ApiRouteConfig = {
  name: 'CreateOrder',
  type: 'api',
  path: '/orders',
  method: 'POST',
  flows: ['order-management']
};
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "CreateOrder",
    "type": "api",
    "path": "/orders",
    "method": "POST",
    "flows": ["order-management"]
}
```

</Tab>
<Tab value='JavaScript'>

```js
const config = {
  name: 'CreateOrder',
  type: 'api',
  path: '/orders',
  method: 'POST',
  flows: ['order-management']
};
```

</Tab>
</Tabs>

👉 [Learn more about Flows →](/docs/development-guide/flows)

### Infrastructure – Configure Event Steps

Customize timeout and retry behavior for Event Steps.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```ts
export const config: EventConfig = {
  name: 'SendEmail',
  type: 'event',
  subscribes: ['email.requested'],
  infrastructure: {
    handler: { timeout: 10 },
    queue: { maxRetries: 5, visibilityTimeout: 60 }
  }
};
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "SendEmail",
    "type": "event",
    "subscribes": ["email.requested"],
    "infrastructure": {
        "handler": {"timeout": 10},
        "queue": {"maxRetries": 5, "visibilityTimeout": 60}
    }
}
```

</Tab>
<Tab value='JavaScript'>

```js
const config = {
  name: 'SendEmail',
  type: 'event',
  subscribes: ['email.requested'],
  infrastructure: {
    handler: { timeout: 10 },
    queue: { maxRetries: 5, visibilityTimeout: 60 }
  }
};
```

</Tab>
</Tabs>

👉 [Learn more about Infrastructure →](/docs/development-guide/infrastructure)

---

## Remember

- **Steps are just files.** Export a `config` and `handler`.  
- Motia auto-discovers and connects them.  
- Combine Steps with **emit + subscribe** to build APIs, workflows, background jobs, or entire systems.  

---

## What's Next?

👉 [Build your first app →](/docs/getting-started/build-your-first-motia-app)
