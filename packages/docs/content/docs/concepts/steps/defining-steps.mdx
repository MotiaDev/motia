---
title: Defining Steps
description: Learn how to create powerful, type-safe steps in TypeScript, Python, and JavaScript with automatic validation and observability.
---

# Defining Steps

Steps are the core building blocks of Motia - isolated, composable functions that handle specific pieces of business logic. Each step is **automatically discovered**, **type-safe**, and **observable** across multiple programming languages.

## The Motia Step Pattern

Every step follows a simple, consistent pattern:

1. **📁 File Naming**: `*.step.*` or `*_step.*` (e.g., `user-api.step.ts`, `process-data.step.py`, `data_processor_step.py`)
2. **⚙️ Configuration**: Export a `config` object defining step behavior
3. **🔧 Handler**: Export a `handler` function containing business logic
4. **🤖 Auto-Discovery**: Motia automatically finds and registers your steps

<Callout type="info">
**🌍 Multi-Language Support**

Write each step in the best language for the job - **TypeScript** for APIs, **Python** for data processing, **JavaScript** for quick scripts. Motia handles type safety and communication automatically.
</Callout>

## Step Capabilities

### **Event-Driven Architecture**
- **Subscribe** to events from other steps
- **Emit** events to trigger subsequent steps
- **Chain** steps together into powerful workflows

### **Type Safety Across Languages**
- **Auto-generated** TypeScript definitions
- **Schema validation** with Zod, Pydantic, JSDoc
- **Runtime validation** for data consistency

### **Built-in Observability**
- **Distributed tracing** across all steps
- **Centralized logging** with step context
- **Visual debugging** in Motia Workbench

## Step Configuration

Each step exports a `config` object that tells Motia how to handle the step. The configuration varies by step type but shares common properties:

### Universal Config Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `type` | `'api' \| 'event' \| 'cron' \| 'noop'` | The step type | ✅ |
| `name` | `string` | Unique identifier for the step | ✅ |
| `description` | `string` | Documentation for the step | - |
| `subscribes` | `string[]` | Topics this step listens to | - |
| `emits` | `string[]` | Topics this step can emit | - |
| `flows` | `string[]` | Flow identifiers this step belongs to | - |

### Type-Specific Properties

Each step type has additional properties:

- **[API Steps](/docs/concepts/steps/api)**: `path`, `method`, `bodySchema`, `responseSchema`
- **[Event Steps](/docs/concepts/steps/event)**: Event-specific configuration
- **[Cron Steps](/docs/concepts/steps/cron)**: `schedule`, cron expressions

## Configuration Examples

<Tabs items={["TypeScript API", "Python Event", "JavaScript Cron"]}>
<Tab value="TypeScript API">

```typescript title="user-api.step.ts"
import { z } from 'zod'

export const config = {
  type: 'api',
  name: 'user-api',
  path: '/users/:id',
  method: 'GET',
  description: 'Fetch user by ID',
  
  // Schema validation
  bodySchema: z.object({
    userId: z.string().uuid()
  }),
  
  responseSchema: {
    200: z.object({
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email()
      })
    })
  },
  
  emits: ['user.fetched'],
  flows: ['user-management']
} as const
```

</Tab>
<Tab value="Python Event">

```python title="process-data.step.py"
from pydantic import BaseModel

class UserData(BaseModel):
    id: str
    name: str
    email: str

config = {
    'type': 'event',
    'name': 'process-data',
    'description': 'Process user data with Python',
    
    'subscribes': ['user.fetched'],
    'emits': ['data.processed'],
    'flows': ['user-management'],
    
    # Pydantic validation
    'input_schema': UserData
}
```

</Tab>
<Tab value="JavaScript Cron">

```javascript title="daily-cleanup.step.js"
export const config = {
  type: 'cron',
  name: 'daily-cleanup',
  description: 'Daily cleanup task',
  
  schedule: '0 2 * * *', // Daily at 2 AM
  
  emits: ['cleanup.completed'],
  flows: ['maintenance']
}
```

</Tab>
</Tabs>

## Step Handlers

The `handler` function contains your step's business logic. Motia automatically calls the handler with validated input data and a context object containing powerful utilities.

### Handler Signature

Every handler receives two parameters:

1. **Input Data** - Validated data from the triggering event (API request, subscription, etc.)
2. **Context Object** - Tools for interacting with the Motia runtime

### Context Object Features

| Tool | Description | Usage |
|------|-------------|-------|
| `emit` | Send events to other steps | `await emit({ topic, data })` |
| `logger` | Centralized logging with trace context | `logger.info('Processing user', { userId })` |
| `state` | Persistent data storage across steps | `await state.set(traceId, key, value)` |
| `traceId` | Unique identifier for request tracing | Flow isolation and debugging |
| `utils` | Helper utilities (dates, crypto, etc.) | Various utility functions |

## Handler Examples with Type Safety

<Tabs items={["TypeScript Handler", "Python Handler", "JavaScript Handler"]}>
<Tab value="TypeScript Handler">

```typescript title="user-api.step.ts"
import { Handlers } from 'motia'
import { z } from 'zod'

// Config with schema validation (from previous example)
export const config = { /* ... */ }

// 🎉 Handler gets full type safety from config!
export const handler: Handlers['user-api'] = async (req, { emit, logger, state, traceId }) => {
  logger.info('Processing user request', { userId: req.params.id })
  
  // req.body is automatically typed from bodySchema
  const { userId } = req.body
  
  // Simulate user fetch
  const user = await getUserById(userId)
  
  // Store in state for other steps
  await state.set(traceId, 'current-user', user)
  
  // Emit event to trigger other steps
  await emit({
    topic: 'user.fetched', // ✅ Type-checked against config.emits
    data: { user, timestamp: new Date() }
  })
  
  // Return response matching responseSchema
  return {
    status: 200,
    body: { user } // ✅ Validated against responseSchema
  }
}

async function getUserById(id: string) {
  // Database query or API call
  return { id, name: 'John Doe', email: 'john@example.com' }
}
```

</Tab>
<Tab value="Python Handler">

```python title="process-data.step.py"
from pydantic import BaseModel
import asyncio

# Config with Pydantic validation (from previous example)
config = { # ... }

async def handler(input_data, ctx):
    """
    🎉 Input is fully typed and validated via Pydantic!
    """
    ctx.logger.info("Processing user data", {
        "user_id": input_data.user['id'],
        "trace_id": ctx.trace_id
    })
    
    # Access validated data
    user = input_data.user
    
    # Python-specific processing (ML, data science, etc.)
    processed_data = {
        'user_id': user['id'],
        'processed_name': user['name'].upper(),
        'email_domain': user['email'].split('@')[1],
        'processed_at': ctx.utils.dates.now().isoformat()
    }
    
    # Store in shared state
    await ctx.state.set(ctx.trace_id, 'processed-user', processed_data)
    
    # Emit to next step
    await ctx.emit({
        'topic': 'data.processed',  # ✅ Validated against config
        'data': processed_data
    })
    
    ctx.logger.info("Data processing complete", {
        "processed_user_id": processed_data['user_id']
    })
    
    return processed_data
```

</Tab>
<Tab value="JavaScript Handler">

```javascript title="send-notifications.step.js"
/**
 * @typedef {Object} ProcessedUser
 * @property {string} user_id
 * @property {string} processed_name
 * @property {string} email_domain
 * @property {string} processed_at
 */

// Config (from previous example)
export const config = { /* ... */ }

/**
 * 🎉 Handler with JSDoc types for IntelliSense
 * @param {ProcessedUser} input - Processed user data
 * @param {import('motia').FlowContext} ctx - Motia context
 */
export const handler = async (input, { emit, logger, state, traceId }) => {
  logger.info('Sending notifications', { userId: input.user_id })
  
  // Get original user data from state
  const originalUser = await state.get(traceId, 'current-user')
  
  // Send notifications (email, SMS, push, etc.)
  const notifications = await Promise.all([
    sendEmail(originalUser.email, 'Welcome!'),
    sendPushNotification(input.user_id, 'Account processed'),
    // Add more notification channels
  ])
  
  const notificationSummary = {
    userId: input.user_id,
    sentAt: new Date().toISOString(),
    channels: notifications.map(n => n.channel),
    count: notifications.length
  }
  
  // Final emit
  await emit({
    topic: 'notifications.sent', // ✅ Validated against config
    data: notificationSummary
  })
  
  logger.info('All notifications sent', notificationSummary)
  
  // Clean up state
  await state.clear(traceId)
  
  return notificationSummary
}

async function sendEmail(email, subject) {
  // Email service integration
  return { channel: 'email', success: true }
}

async function sendPushNotification(userId, message) {
  // Push notification service
  return { channel: 'push', success: true }
}
```

</Tab>
</Tabs>

## Type Safety Benefits

### Automatic Type Generation

Motia automatically generates TypeScript definitions based on your step configurations:

```typescript title="types.d.ts (Auto-generated)"
declare module 'motia' {
  interface Handlers {
    'user-api': ApiRouteHandler<
      { userId: string }, // From bodySchema
      ApiResponse<200, { user: User }> // From responseSchema
    >
    'process-data': EventHandler<
      { user: User }, // From subscribes topic
      { topic: 'data.processed'; data: ProcessedUser } // From emits
    >
  }
}
```

### Cross-Language Validation

Even in multi-language workflows, Motia ensures data consistency:

1. **TypeScript API** validates input with Zod schemas
2. **Python step** receives validated data via Pydantic models
3. **JavaScript step** gets type hints via JSDoc annotations

<Callout type="default">
**🚀 Ready to Build?**

Check out **[API Endpoints](/docs/getting-started/build-your-first-app/creating-your-first-rest-api)** to see a complete REST API tutorial in action, or explore specific step types:

- **[API Steps](/docs/concepts/steps/api)** - HTTP endpoints with validation
- **[Event Steps](/docs/concepts/steps/event)** - Async event processing
- **[Cron Steps](/docs/concepts/steps/cron)** - Scheduled tasks
</Callout>
