---
title: Customizing Flows
description: Make your iii console flows look exactly how you want
---

By default, the iii console shows your Steps with their code. Great for developers. But what if you're sharing with:
- Frontend developers who just need to know the API
- Product managers who want to see the big picture
- Designers who care about the flow, not the code

You can override how Steps look in the iii console with custom React components.

---

## Custom UI for Steps

Want to change how a Step looks? Create a `.tsx` or `.jsx` file next to it.
**File structure:**

<Tabs items={['TypeScript', 'JavaScript']}>
  <Tab value="TypeScript">
<Folder name="src" defaultOpen>
  <Folder name="create-order" defaultOpen>
    <File name="create-order.step.ts" />
    <File name="create-order.step.tsx" />
  </Folder>
</Folder>
  </Tab>
  <Tab value="JavaScript">
<Folder name="src" defaultOpen>
  <Folder name="create-order" defaultOpen>
    <File name="create-order.step.js" />
    <File name="create-order.step.jsx" />
  </Folder>
</Folder>
  </Tab>
</Tabs>

Same name, different extension. Motia connects them automatically.

---

## Simple Example

Let's use the built-in `EventNode` but add an icon:

```tsx title="src/send-email.step.tsx"
import { EventNode, EventNodeProps } from 'motia/workbench'
import React from 'react'

export const Node: React.FC<EventNodeProps> = (props) => {
  return (
    <EventNode {...props}>
      <div className="flex flex-row items-start gap-2">
        <div className="text-sm text-gray-400 font-mono">{props.data.description}</div>
        <img
          style={{ width: '64px', height: '64px' }}
          src="https://www.motia.dev/icon.png"
        />
      </div>
    </EventNode>
  )
}
```

That's it! The Step now shows with your custom content inside, plus an icon.

---

## Built-in Components

Motia gives you ready-made components for different Step types:

| Component   | For which Steps | What you get |
| ----------- | --------------- | ------------ |
| `EventNode` | Queue triggers  | Styled box with connection points |
| `ApiNode`   | API triggers    | Box with request/response info |
| `CronNode`  | Cron triggers   | Box with schedule info |
| `NoopNode`  | NOOP steps      | Different color for visual distinction |

---

## Fully Custom UI

Want complete control? Build from scratch. Here's a real example:

**The Step:**

```typescript title="src/process-order.step.ts"
import { type Handlers, type StepConfig } from 'motia'

export const config = {
  name: 'ProcessFoodOrder',
  description: 'Process incoming food orders',
  triggers: [
    { type: 'queue', topic: 'process-food-order' },
  ],
  enqueues: ['notification'],
  flows: ['basic-tutorial'],
} as const satisfies StepConfig
```

**Custom UI:**

```tsx title="src/process-order.step.tsx"
import React from 'react'
import { BaseHandle, Position } from 'motia/workbench'
import type { EventNodeProps } from 'motia/workbench'

export default function ProcessOrderUI({ data }: EventNodeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    return false
  }

  return (
    <div
      onClick={handleClick}
      className="relative bg-white border-2 border-blue-500 rounded-lg py-3 px-4 shadow-md min-w-[200px]"
      style={{ pointerEvents: 'auto' }}
    >
      <BaseHandle type="target" position={Position.Top} />

      <div className="text-center">
        <div className="font-semibold text-blue-700">
          Process Order
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {data.name}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Handles food orders
        </div>
      </div>

      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}
```

**What this does:**
- Shows a clean card instead of code
- Has connection points (the `BaseHandle` parts)
- Prevents code viewer from popping up
- Uses your brand colors (blue border here)

**Important parts:**
- `BaseHandle` components - These are the connection dots
- `onClick={handleClick}` - Stops the code viewer from opening
- `Position.Top` and `Position.Bottom` - Where connections attach
- Export as `default function` - Required for Motia to find it

---

## NOOP Steps

NOOP = "No Operation". These Steps don't actually run code. They just sit in your flow diagram to represent:

- **External stuff** - Webhooks, third-party APIs, manual processes
- **Human actions** - Approval gates, manual reviews
- **Testing** - Placeholder nodes while building flows
- **Documentation** - Show the complete picture visually

---

## Creating NOOP Steps

NOOP Steps are config-only. No handler needed.

```typescript title="src/approval-gate.step.ts"
import { NoopConfig } from 'motia'

export const config: NoopConfig = {
  type: 'noop',
  name: 'ApprovalGate',
  description: 'Manager reviews and approves',
  virtualSubscribes: ['order.created'],
  virtualEnqueues: ['order.approved', 'order.rejected'],
  flows: ['order-flow']
}
```

**Add custom UI (optional):**

```tsx title="src/approval-gate.step.tsx"
import React from 'react'
import { BaseHandle, Position } from 'motia/workbench'

export default function ApprovalGate() {
  return (
    <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-400">
      <BaseHandle type="target" position={Position.Top} />

      <div className="text-center">
        <div className="font-medium">Waiting for approval</div>
        <div className="text-xs text-gray-600">Manager review required</div>
      </div>

      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}
```

---

## Common NOOP Examples

### 1. Waiting for Stripe Payment

```typescript title="src/stripe-webhook.step.ts"
export const config: NoopConfig = {
  type: 'noop',
  name: 'StripeWebhook',
  description: 'Waits for payment confirmation from Stripe',
  virtualSubscribes: ['payment.initiated'],
  virtualEnqueues: ['/api/stripe/webhook'],
  flows: ['payment']
}
```

### 2. Human Approval

```typescript title="src/manager-review.step.ts"
export const config: NoopConfig = {
  type: 'noop',
  name: 'ManagerReview',
  description: 'Manager reviews the request',
  virtualSubscribes: ['approval.requested'],
  virtualEnqueues: ['/api/approvals/submit'],
  flows: ['approval']
}
```

### 3. GitHub Webhook

```typescript title="src/github-webhook.step.ts"
export const config: NoopConfig = {
  type: 'noop',
  name: 'GitHubWebhook',
  description: 'Waits for repo events from GitHub',
  virtualSubscribes: ['repo.watched'],
  virtualEnqueues: ['/api/github/webhook'],
  flows: ['ci-cd']
}
```

---

## Tips

**For Custom UIs:**
- Start with built-in components (`EventNode`, `ApiNode`)
- Keep it simple - focus on clarity
- Use Tailwind for styling
- Add `BaseHandle` for connections
- Don't overthink it - simple cards work great

**For NOOP Steps:**
- Always include `virtualSubscribes` (even if empty `[]`)
- Use clear, descriptive names
- Explain what happens externally in the description
- Connect them to your flow with virtual enqueues/subscribes

---

## Quick Reference

### What to Import

```typescript
import React from 'react'
import { BaseHandle, Position } from 'motia/workbench'
import type { EventNodeProps } from 'motia/workbench'
```

### Where Handles Go

- **Top** (`Position.Top`) - For inputs (things coming in)
- **Bottom** (`Position.Bottom`) - For outputs (things going out)
- Flows go top to bottom

### Export Format

```tsx
export default function MyCustomNode() {
  // Your UI
}
```

or

```tsx
export const Node: React.FC<EventNodeProps> = (props) => {
  // Your UI using props
}
```

---
