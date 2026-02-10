---
title: Overview
description: Build production-grade backends with a single primitive - APIs, background jobs, workflows, and AI agents unified
---

import VideoPlayer from '@/components/VideoPlayer';

<VideoPlayer videoPath="https://assets.motia.dev/videos/mp4/site/v1/2-motia-overview-core-concepts.mp4" gifPath="https://assets.motia.dev/images/gifs/v1/2-motia-overview-core-concepts.gif" title="Overview & Core Concepts" className="mb-8" />

**Build production-grade backends with a single primitive.**

Motia is a unified backend framework that combines APIs, background jobs, durable workflows, AI agents, streaming, and observability around one core primitive: **the Step**.

Want an API? That's a Step.
Need a background job? That's a Step.
Scheduled task? Also a Step.

Write each Step in whatever language makes sense - TypeScript, Python, or JavaScript. They all run together, share the same state, and talk through queued messages.

## How It Works

Every Step is just a file with two parts:

**1. Config** → When and how it runs
**2. Handler** → What it does

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript title="src/my-step.step.ts"
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'MyStep',
  description: 'Handles incoming requests',
  triggers: [
    { type: 'api', path: '/endpoint', method: 'POST' },
  ],
  enqueues: ['task.done'],
  flows: ['my-flow'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, { enqueue, logger }) => {
  logger.info('Processing request')

  await enqueue({
    topic: 'task.done',
    data: { result: 'success' }
  })

  return { status: 200, body: { success: true } }
}
```

</Tab>
<Tab value='Python'>

```python title="src/my_step.py"
config = {
    "name": "MyStep",
    "description": "Handles incoming requests",
    "triggers": [
        {"type": "api", "path": "/endpoint", "method": "POST"}
    ],
    "enqueues": ["task.done"],
    "flows": ["my-flow"]
}

async def handler(req, context):
    context.logger.info("Processing request")

    await context.enqueue({
        "topic": "task.done",
        "data": {"result": "success"}
    })

    return {"status": 200, "body": {"success": True}}
```

</Tab>
<Tab value='JavaScript'>

```javascript title="src/my-step.step.js"
const config = {
  name: 'MyStep',
  description: 'Handles incoming requests',
  triggers: [
    { type: 'api', path: '/endpoint', method: 'POST' },
  ],
  enqueues: ['task.done'],
  flows: ['my-flow'],
}

const handler = async (req, { enqueue, logger }) => {
  logger.info('Processing request')

  await enqueue({
    topic: 'task.done',
    data: { result: 'success' }
  })

  return { status: 200, body: { success: true } }
}

module.exports = { config, handler }
```

</Tab>
</Tabs>

Drop this file in your `src/` folder and Motia finds it automatically. No registration, no imports, no setup.

[Learn more about Steps](/docs/concepts/steps)

---

## Event-Driven Architecture

Steps don't call each other. They **enqueue** messages to topics that other Steps consume.

This means:
- Your API can trigger a background job without waiting for it
- Steps run independently and retry on failure
- You can add new Steps without touching existing ones
- Everything is traceable from start to finish

**Example:** An API enqueues a message, a queue Step picks it up:

```typescript
// API Step enqueues
await enqueue({ topic: 'user.created', data: { email } })

// Queue Step triggers on the topic
config = {
  triggers: [
    { type: 'queue', topic: 'user.created' }
  ]
}
```

That's it. No coupling, no dependencies.

---

## Project Structure & Auto-Discovery

Motia automatically discovers Steps - no manual registration required.

### Basic Structure

<Files>
<Folder name="my-project" defaultOpen>
  <Folder name="src" defaultOpen>
    <Folder name="api">
      <File name="create-user.step.ts" />
      <File name="get-user.step.ts" />
    </Folder>
    <Folder name="queues">
      <File name="send-email.step.ts" />
      <File name="process-data_step.py" />
    </Folder>
    <Folder name="cron">
      <File name="daily-report.step.ts" />
    </Folder>
    <Folder name="streams">
      <File name="notifications.stream.ts" />
    </Folder>
  </Folder>
  <File name="config.yml" />
  <File name=".env" />
  <File name="package.json" />
  <File name="requirements.txt" />
  <File name="tsconfig.json" />
</Folder>
</Files>

<Callout type="info">
The `src/` directory is the heart of your Motia application. All your workflow logic lives here, and Motia automatically discovers any file following the naming pattern.
</Callout>

### Auto-Discovery Rules

Motia scans the `src/` directory and automatically registers files that:

1. **Match naming pattern:**
   - TypeScript: `.step.ts`
   - JavaScript: `.step.js`
   - Python: `_step.py` (note: underscore before `step`)

2. **Export a `config` object** with Step configuration

3. **Export a `handler` function** with business logic

**No imports. No registration. Just create the file and Motia finds it.**

---

## Multi-Language Support

Every Step can be in a different language. They all run in the same process and share everything.

**Currently Supported:**
- **TypeScript** `.step.ts`
- **Python** `_step.py` (install with `pip install motia-python`)
- **JavaScript** `.step.js`

**Coming Soon:**
- Ruby `.step.rb`
- C# `.step.cs`
- Go `.step.go`
- And many more...

**Example project:**

<Files>
<Folder name="my-app" defaultOpen>
  <Folder name="src" defaultOpen>
    <File name="api-endpoint.step.ts" />
    <File name="ml-inference_step.py" />
    <File name="send-email.step.js" />
  </Folder>
</Folder>
</Files>

All three Steps work together. TypeScript API enqueues a message, Python processes with ML, JavaScript sends the result.

---

## Core Concepts

### State Management
Persistent key-value storage that works across all Steps and languages. `state.set` returns `{ new_value, old_value }`.

```typescript
const result = await state.set('users', 'user-123', { name: 'John' })
// result = { new_value: { name: 'John' }, old_value: null }
const user = await state.get('users', 'user-123')
```

[Learn about State](/docs/development-guide/state-management)

### Real-Time Streams
Push live updates to connected clients (browsers, mobile apps).

```typescript
await streams.notifications.set('user-123', 'notif-1', {
  message: 'Order shipped!',
  timestamp: new Date().toISOString()
})
```

Clients receive updates instantly.

[Learn about Streams](/docs/development-guide/streams)

### Adapters
Pluggable infrastructure components that enable horizontal scaling and custom implementations. Swap default file-based storage with Redis, RabbitMQ, or your own implementations without changing your code.

[Learn about Adapters](/docs/development-guide/adapters)

### Context Object
Every handler gets a context object with everything you need:

| Property | What It Does |
|----------|--------------|
| `logger` | Structured logging |
| `enqueue` | Trigger other Steps |
| `state` | Persistent storage |
| `streams` | Real-time updates |
| `traceId` | Request tracing |

---

## Development Tool - iii Console

![create-pet](../img/build-your-first-app/create-api.png)

Visual interface for testing APIs, building and debugging flows:

- See your entire flow as a beautiful diagram
- Test API endpoints in the browser
- Watch logs in real-time
- Inspect state as it changes

[Learn about iii Console](/docs/concepts/workbench)

---

## What's Next?

<Cards>
  <Card href="/docs/concepts/steps" title="Steps">
    Deep dive into Steps - the only primitive you need
  </Card>

  <Card href="/docs/getting-started/quick-start" title="Quick Start">
    Build your first app in 5 minutes
  </Card>
</Cards>
