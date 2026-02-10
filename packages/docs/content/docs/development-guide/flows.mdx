---
title: Flows
description: Group multiple steps to be visible in diagrams in the iii console
---

Flows group related Steps together so you can see them as connected workflows in the iii console. Add `flows` to your Step config - it's an array of flow names.

## How It Works

Add `flows` to any Step config. Each string is a flow name.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'CreateResource',
  description: 'Create a new resource',
  triggers: [
    { type: 'api', path: '/resources', method: 'POST' },
  ],
  flows: ['resource-management'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "CreateResource",
    "description": "Create a new resource",
    "triggers": [
        {"type": "api", "path": "/resources", "method": "POST"}
    ],
    "flows": ["resource-management"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'CreateResource',
  description: 'Create a new resource',
  triggers: [
    { type: 'api', path: '/resources', method: 'POST' },
  ],
  flows: ['resource-management']
}
```

</Tab>
</Tabs>

---

## Example

Two Steps working together in one flow.

![API and Queue Steps connected in a flow](../img/flows-api-event.png)

**API Step - Create resource:**

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript title="src/create-resource.step.ts"
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'CreateResource',
  description: 'Create a new resource and trigger email',
  triggers: [
    { type: 'api', path: '/resources', method: 'POST' },
  ],
  enqueues: ['send-email'],
  flows: ['resource-management'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, { enqueue, logger }) => {
  logger.info('Creating resource', { title: req.body.title })

  await enqueue({
    topic: 'send-email',
    data: { email: req.body.email }
  })

  return { status: 201, body: { id: '123' } }
}
```

</Tab>
<Tab value='Python'>

```python title="src/create_resource_step.py"
config = {
    "name": "CreateResource",
    "description": "Create a new resource and trigger email",
    "triggers": [
        {"type": "api", "path": "/resources", "method": "POST"}
    ],
    "enqueues": ["send-email"],
    "flows": ["resource-management"]
}

async def handler(req, ctx):
    ctx.logger.info("Creating resource", {"title": req["body"]["title"]})

    await ctx.enqueue({
        "topic": "send-email",
        "data": {"email": req["body"]["email"]}
    })

    return {"status": 201, "body": {"id": "123"}}
```

</Tab>
<Tab value='JavaScript'>

```javascript title="src/create-resource.step.js"
const config = {
  name: 'CreateResource',
  description: 'Create a new resource and trigger email',
  triggers: [
    { type: 'api', path: '/resources', method: 'POST' },
  ],
  enqueues: ['send-email'],
  flows: ['resource-management']
}

const handler = async (req, { enqueue, logger }) => {
  logger.info('Creating resource', { title: req.body.title })

  await enqueue({
    topic: 'send-email',
    data: { email: req.body.email }
  })

  return { status: 201, body: { id: '123' } }
}

module.exports = { config, handler }
```

</Tab>
</Tabs>

**Queue Step - Send email:**

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript title="src/send-email.step.ts"
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'SendEmail',
  description: 'Send an email notification',
  triggers: [
    { type: 'queue', topic: 'send-email' },
  ],
  flows: ['resource-management'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { logger }) => {
  logger.info('Sending email', { email: input.email })
}
```

</Tab>
<Tab value='Python'>

```python title="src/send_email_step.py"
config = {
    "name": "SendEmail",
    "description": "Send an email notification",
    "triggers": [
        {"type": "queue", "topic": "send-email"}
    ],
    "flows": ["resource-management"]
}

async def handler(input, ctx):
    ctx.logger.info("Sending email", {"email": input["email"]})
```

</Tab>
<Tab value='JavaScript'>

```javascript title="src/send-email.step.js"
const config = {
  name: 'SendEmail',
  description: 'Send an email notification',
  triggers: [
    { type: 'queue', topic: 'send-email' },
  ],
  flows: ['resource-management']
}

const handler = async (input, { logger }) => {
  logger.info('Sending email', { email: input.email })
}

module.exports = { config, handler }
```

</Tab>
</Tabs>

Both Steps have `flows: ['resource-management']`. In the iii console, they appear connected.

---

## Multiple Flows

A Step can belong to multiple flows.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'SendEmail',
  description: 'Send an email notification',
  triggers: [
    { type: 'queue', topic: 'send-email' },
  ],
  flows: ['resource-management', 'user-onboarding'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "SendEmail",
    "description": "Send an email notification",
    "triggers": [
        {"type": "queue", "topic": "send-email"}
    ],
    "flows": ["resource-management", "user-onboarding"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'SendEmail',
  description: 'Send an email notification',
  triggers: [
    { type: 'queue', topic: 'send-email' },
  ],
  flows: ['resource-management', 'user-onboarding']
}
```

</Tab>
</Tabs>

This Step appears in both flows in the iii console.

## Steps Without Flows

Steps work fine without flows.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'HealthCheck',
  description: 'Health check endpoint',
  triggers: [
    { type: 'api', path: '/health', method: 'GET' },
  ],
} as const satisfies StepConfig
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "HealthCheck",
    "description": "Health check endpoint",
    "triggers": [
        {"type": "api", "path": "/health", "method": "GET"}
    ]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'HealthCheck',
  description: 'Health check endpoint',
  triggers: [
    { type: 'api', path: '/health', method: 'GET' },
  ],
}
```

</Tab>
</Tabs>

---

## Flows in the iii Console

The iii console has a dropdown to filter by flow. Select a flow to see only the Steps that belong to it.

![Flow dropdown in iii Console](../img/drop-down-flow.png)

### Virtual Connections

Use `virtualEnqueues` and `virtualSubscribes` for visualization without actual events:

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type StepConfig } from 'motia'

export const config = {
  name: 'CreateResource',
  description: 'Create a resource requiring approval',
  triggers: [
    { type: 'api', path: '/resources', method: 'POST' },
  ],
  virtualEnqueues: ['approval.required'],
  flows: ['resource-management'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "CreateResource",
    "description": "Create a resource requiring approval",
    "triggers": [
        {"type": "api", "path": "/resources", "method": "POST"}
    ],
    "virtualEnqueues": ["approval.required"],
    "flows": ["resource-management"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'CreateResource',
  description: 'Create a resource requiring approval',
  triggers: [
    { type: 'api', path: '/resources', method: 'POST' },
  ],
  virtualEnqueues: ['approval.required'],
  flows: ['resource-management']
}
```

</Tab>
</Tabs>

Virtual connections show as gray/dashed lines in the iii console. Real connections (from `enqueues` and queue triggers) show as dark solid lines.

![Virtual connections with labels in iii Console](../img/virtual-emit-subscribe.png)

### Labels

Add labels to connections in the iii console:

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { type StepConfig } from 'motia'

export const config = {
  name: 'SendEmail',
  description: 'Send email notifications',
  triggers: [
    { type: 'api', path: '/send', method: 'POST' },
  ],
  virtualEnqueues: [
    { topic: 'email-sent', label: 'Email delivered' },
    { topic: 'email-failed', label: 'Failed to send', conditional: true },
  ],
  flows: ['notifications'],
} as const satisfies StepConfig
```

</Tab>
<Tab value='Python'>

```python
config = {
    "name": "SendEmail",
    "description": "Send email notifications",
    "triggers": [
        {"type": "api", "path": "/send", "method": "POST"}
    ],
    "virtualEnqueues": [
        {"topic": "email-sent", "label": "Email delivered"},
        {"topic": "email-failed", "label": "Failed to send", "conditional": True}
    ],
    "flows": ["notifications"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  name: 'SendEmail',
  description: 'Send email notifications',
  triggers: [
    { type: 'api', path: '/send', method: 'POST' },
  ],
  virtualEnqueues: [
    { topic: 'email-sent', label: 'Email delivered' },
    { topic: 'email-failed', label: 'Failed to send', conditional: true }
  ],
  flows: ['notifications']
}
```

</Tab>
</Tabs>

### NOOP Steps

NOOP Steps don't run code. They're for visualization only:

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
import { NoopConfig } from 'motia'

export const config: NoopConfig = {
  type: 'noop',
  name: 'ApprovalGate',
  virtualEnqueues: ['approved'],
  virtualSubscribes: ['approval.required'],
  flows: ['resource-management']
}
```

</Tab>
<Tab value='Python'>

```python
config = {
    "type": "noop",
    "name": "ApprovalGate",
    "virtualEnqueues": ["approved"],
    "virtualSubscribes": ["approval.required"],
    "flows": ["resource-management"]
}
```

</Tab>
<Tab value='JavaScript'>

```javascript
const config = {
  type: 'noop',
  name: 'ApprovalGate',
  virtualEnqueues: ['approved'],
  virtualSubscribes: ['approval.required'],
  flows: ['resource-management']
}

module.exports = { config }
```

</Tab>
</Tabs>

[Learn about customizing how flows look](/docs/development-guide/customizing-flows)

---
