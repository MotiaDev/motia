---
title: NOOP Steps
---

NOOP (No Operation) steps are a powerful feature in Motia that serve multiple purposes:

1. Modeling external processes, webhooks and integrations
2. Representing human-in-the-loop activities
3. Creating custom visualizations in the workbench
4. Testing flows during development

## File Structure

NOOP steps require two files with the same base name:
- `stepName.step.ts` - Contains the step configuration
- `stepName.step.tsx` - Contains the UI component (optional)

### Step Configuration File (.ts)

<Tabs items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
    // myStep.step.ts
    import { NoopConfig } from 'motia'

    export const config: NoopConfig = {
      type: 'noop',
      name: 'My NOOP Step',
      description: 'Description of what this step simulates',
      virtualEmits: ['event.one', 'event.two'],
      virtualSubscribes: [], // Required even if empty
      flows: ['my-flow'],
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    // myStep.step.js
    const config = {
      type: 'noop',
      name: 'My NOOP Step',
      description: 'Description of what this step simulates',
      virtualEmits: ['event.one', 'event.two'],
      virtualSubscribes: [], // Required even if empty
      flows: ['my-flow'],
    }

    module.exports = { config }
    ```
  </Tab>
</Tabs>

### UI Component File (.tsx)

<Tabs items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
    // myStep.step.tsx
    import React from 'react'
    import { BaseHandle, Position } from 'motia/workbench'

    export default function MyStep() {
      return (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 text-white">
          <div className="text-sm font-medium">My Step UI</div>
          {/* Your custom UI elements */}
          <BaseHandle type="source" position={Position.Bottom} />
        </div>
      )
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    // myStep.step.jsx
    import React from 'react'
    import { BaseHandle, Position } from 'motia/workbench'

    export default function MyStep() {
      return (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 text-white">
          <div className="text-sm font-medium">My Step UI</div>
          {/* Your custom UI elements */}
          <BaseHandle type="source" position={Position.Bottom} />
        </div>
      )
    }
    ```
  </Tab>
</Tabs>

## Example: Webhook Testing

Here's a complete example of a NOOP step that simulates webhook events:

<Tabs items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
    // test-webhook.step.ts
    import { NoopConfig } from 'motia'

    export const config: NoopConfig = {
      type: 'noop',
      name: 'Webhook Simulator',
      description: 'Simulates incoming webhook events',
      virtualEmits: ['webhook.received'],
      virtualSubscribes: [],
      flows: ['webhook-flow'],
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    // test-webhook.step.js
    const config = {
      type: 'noop',
      name: 'Webhook Simulator',
      description: 'Simulates incoming webhook events',
      virtualEmits: ['webhook.received'],
      virtualSubscribes: [],
      flows: ['webhook-flow'],
    }

    module.exports = { config }
    ```
  </Tab>
</Tabs>

<Tabs items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
    // test-webhook.step.tsx
    import React from 'react'
    import { BaseHandle, Position } from 'motia/workbench'

    export default function WebhookSimulator() {
      return (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 text-white">
          <div className="text-sm font-medium mb-2">Webhook Simulator</div>
          <button 
            onClick={() => {
              fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'test' }),
              })
            }}
            className="px-3 py-1 bg-blue-600 rounded text-sm"
          >
            Trigger Webhook
          </button>
          <BaseHandle type="source" position={Position.Bottom} />
        </div>
      )
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    // test-webhook.step.jsx
    import React from 'react'
    import { BaseHandle, Position } from 'motia/workbench'

    export default function WebhookSimulator() {
      return (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 text-white">
          <div className="text-sm font-medium mb-2">Webhook Simulator</div>
          <button 
            onClick={() => {
              fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'test' }),
              })
            }}
            className="px-3 py-1 bg-blue-600 rounded text-sm"
          >
            Trigger Webhook
          </button>
          <BaseHandle type="source" position={Position.Bottom} />
        </div>
      )
    }
    ```
  </Tab>
</Tabs>

## Representing External Processes

NOOP steps represent parts of your workflow that happen outside your system. Common examples include:

### Webhook Callbacks

<Tabs  items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
    export const config: NoopConfig = {
      type: 'noop',
      name: 'Wait for Stripe Webhook',
      description: 'Waits for payment confirmation',
      virtualSubscribes: ['payment.initiated'],
      virtualEmits: ['/api/stripe/webhook'],
      flows: ['payment'],
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    const config = {
      type: 'noop',
      name: 'Wait for Stripe Webhook',
      description: 'Waits for payment confirmation',
      virtualSubscribes: ['payment.initiated'],
      virtualEmits: ['/api/stripe/webhook'],
      flows: ['payment'],
    }
    ```
  </Tab>
</Tabs>

### Human Approvals

<Tabs  items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
    export const config: NoopConfig = {
      type: 'noop',
      name: 'Manager Review',
      description: 'Manager reviews request',
      virtualSubscribes: ['approval.requested'],
      virtualEmits: ['/api/approvals/submit'],
      flows: ['approval'],
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    const config = {
      type: 'noop',
      name: 'Manager Review',
      description: 'Manager reviews request',
      virtualSubscribes: ['approval.requested'],
      virtualEmits: ['/api/approvals/submit'],
      flows: ['approval'],
    }
    ```
  </Tab>
</Tabs>

### External System Integration

<Tabs  items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
      export const config: NoopConfig = {
        type: 'noop',
        name: 'GitHub Webhook',
        description: 'Waiting for repository events',
        virtualSubscribes: ['repository.watched'],
        virtualEmits: ['/api/github/webhook'],
        flows: ['repo-automation'],
      }
      ```
  </Tab>
  <Tab value="JS">
    ```javascript
    const config = {
      type: 'noop',
      name: 'GitHub Webhook',
      description: 'Waiting for repository events',
      virtualSubscribes: ['repository.watched'],
      virtualEmits: ['/api/github/webhook'],
      flows: ['repo-automation'],
    }
    ```
  </Tab>
</Tabs>

### Physical Processes

<Tabs  items={['TS', 'JS']}>
  <Tab value="TS">
    ```typescript
    export const config: NoopConfig = {
      type: 'noop',
      name: 'Order Fulfillment',
      description: 'Warehouse processes order',
      virtualSubscribes: ['order.placed'],
      virtualEmits: ['/api/warehouse/status'],
      flows: ['fulfillment'],
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    const config = {
      type: 'noop',
      name: 'Order Fulfillment',
      description: 'Warehouse processes order',
      virtualSubscribes: ['order.placed'],
      virtualEmits: ['/api/warehouse/status'],
      flows: ['fulfillment'],
    }
    ```
  </Tab>
</Tabs>

## Visualization in Workbench

NOOP steps are visually represented in the Motia Workbench with the following characteristics:

- Distinct node representation with clear input/output handles
- Visual indicators for virtual event connections
- Status indicators for waiting states
- Clear visualization of external system dependencies

## Custom UI

You can enhance your NOOP steps with custom React components for better visualization:

<Tabs  items={['TS', 'JS']}>
  <Tab value="TS">
    ```tsx
    // customNode.step.tsx
    import React from 'react'
    import { BaseHandle, EventNodeProps, Position } from 'motia/workbench'

    export default (_: EventNodeProps) => {
      return (
        <div className="p-3 px-6 flex flex-col max-w-[300px] bg-blue-500 border-white rounded-full text-white border border-solid text-center text-sm">
          <div>Custom Processing</div>
          <BaseHandle type="target" position={Position.Top} />
          <BaseHandle type="source" position={Position.Bottom} />
        </div>
      )
    }

    // customNode.step.ts
    export const config: NoopConfig = {
      type: 'noop',
      name: 'Custom Process',
      virtualEmits: ['/api/process/complete'],
      virtualSubscribes: ['process.start'],
      flows: ['custom-flow']
    }
    ```
  </Tab>
  <Tab value="JS">
    ```jsx
    // customNode.step.jsx
    import React from 'react'
    import { BaseHandle, EventNodeProps, Position } from 'motia/workbench'

    export default (_: EventNodeProps) => {
      return (
        <div className="p-3 px-6 flex flex-col max-w-[300px] bg-blue-500 border-white rounded-full text-white border border-solid text-center text-sm">
          <div>Custom Processing</div>
          <BaseHandle type="target" position={Position.Top} />
          <BaseHandle type="source" position={Position.Bottom} />
        </div>
      )
    }

    // customNode.step.js
    const config = {
      type: 'noop',
      name: 'Custom Process',
      virtualEmits: ['/api/process/complete'],
      virtualSubscribes: ['process.start'],
      flows: ['custom-flow']
    }

    module.exports = {config};
    ```
  </Tab>
</Tabs>

## Best Practices

| Category | Guidelines |
|----------|------------|
| **File Organization** | • Keep configuration and UI code in separate files<br/>• Use `.step.ts` for configuration<br/>• Use `.step.tsx` for UI components |
| **UI Components** | • Use functional React components<br/>• Include proper TypeScript types<br/>• Follow Tailwind's utility classes<br/>• Keep components minimal and focused<br/>• Design clear visual connection points<br/>• Always include BaseHandle components for flow connections |
| **Configuration** | • Always include `virtualSubscribes` (even if empty)<br/>• Use descriptive names for virtual events<br/>• Include clear descriptions<br/>• Use descriptive, action-oriented names |
| **External Process Modeling** | • Document expected timeframes and SLAs<br/>• Define all possible outcomes and edge cases<br/>• Use exact API route matching |
| **Testing** | • Create isolated test flows<br/>• Use realistic test data<br/>• Handle errors gracefully<br/>• Implement clear status indicators<br/>• Label test steps explicitly<br/>• Provide visual feedback for actions |

## Component Reference

### Core Imports

| Import | Purpose |
|--------|---------|
| `BaseHandle` | A React component that renders connection points for nodes in the workflow. Used to define where edges (connections) can start or end on a node. |
| `EventNodeProps` | (TypeScript only) Interface defining the properties passed to node components, including node data, selected state, and connection information. |
| `Position` | (TypeScript only) Enum that specifies the possible positions for handles on a node (Top, Right, Bottom, Left). Used to control where connection points appear. |

### Handle Placement

| Handle Type | Position | 
|------------|----------|
| Input Handles | Position.Top |
| Output Handles | Position.Bottom |
| Flow Direction | Top to bottom |

### Styling Guidelines

| Category | Guidelines |
|----------|------------|
| Colors | Use semantic colors to indicate state (success, error, pending) |
| States | • Implement clear visual indicators for active/inactive states<br/>• Use subtle animations for state transitions |
| Design System | • Follow your project's design tokens<br/>• Maintain consistent spacing and padding<br/>• Use standard border radiuses<br/>• Ensure high contrast for readability<br/>• Use consistent font sizes (14px-16px) |
