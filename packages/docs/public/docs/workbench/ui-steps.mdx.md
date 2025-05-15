---
title: UI Steps
---

UI Steps provide a powerful way to create custom, visually appealing representations of your workflow steps in the Workbench flow visualization tool. 

With UI Steps, you can enhance the user experience by designing intuitive, context-aware visual components that clearly communicate your flow's sequencing and events.

## Overview

To create a custom UI for a step, create a `.tsx` or `.jsx` file next to your step file with the same base name:

<Tabs items={['tsx', 'jsx']}>
  <Tab value="tsx">
    ```
    steps/
      └── myStep/
      ├── myStep.step.ts      # Step definition
      └── myStep.step.tsx     # Visual override
    ```
  </Tab>
  <Tab value="jsx">
    ```
    steps/
      └── myStep/
      ├── myStep.step.js      # Step definition
      └── myStep.step.jsx     # Visual override
    ```
  </Tab>
</Tabs>

## Basic Usage

<Tabs items={['TypeScript', 'JavaScript']}>
  <Tab>
    ```typescript
    // myStep.step.tsx

    import React from 'react'
    import { EventNode } from 'motia/workbench'
    import type { EventNodeProps } from 'motia/workbench'

    export default function MyStep({ data }: EventNodeProps) {
      return (
        <EventNode
          data={data}
          variant="white"
          className="py-2 px-4"
        />
      )
    }
    ```
  </Tab>
  <Tab>
    ```javascript
    // myStep.step.jsx

    import React from 'react'
    import { EventNode } from 'motia/workbench'

    export default function MyStep({ data }) {
      return (
        <EventNode
          data={data}
          variant="white"
          className="py-2 px-4"
        />
      )
    }
    ```
  </Tab>
</Tabs>

## Components

Motia Workbench provides out of the box components that you can use to create custom UI steps, which apply to different types of steps.

### EventNode

The main component for general-purpose steps.

| Prop | Type | Description |
|------|------|-------------|
| data | `EventNodeProps['data']` | Step data passed from Workbench |
| variant | `'white' \| 'ghost' \| 'noop'` | Visual style variant |
| shape | `'rounded' \| 'square' \| 'noop'` | Node shape style |
| className | `string` | Additional CSS classes |

<Tabs items={['TypeScript', 'JavaScript']}>
  <Tab>
    ```typescript
    // customStep.step.tsx

    import React from 'react'
    import { EventNode } from 'motia/workbench'
    import type { EventNodeProps } from 'motia/workbench'

    export default function CustomStep({ data }: EventNodeProps) {
      return (
        <EventNode
          data={data}
          variant="white"
          shape="rounded"
          className="py-2 px-4"
        >
          <div>Custom content</div>
        </EventNode>
      )
    }
    ```
  </Tab>
  <Tab>
    ```javascript
    // customStep.step.jsx

    import React from 'react'
    import { EventNode } from 'motia/workbench'

    export default function CustomStep({ data }) {
      return (
        <EventNode
          data={data}
          variant="white"
          shape="rounded"
          className="py-2 px-4"
        >
          <div>Custom content</div>
        </EventNode>
      )
    }
    ```
  </Tab>
</Tabs>

<Callout type="info">
The `EventNodeProps` type provides essential information about your step. Here are the key properties:

| Property | Type | Description |
|----------|------|-------------|
| type | `string` | The type of the step |
| name | `string` | The name of the step |
| description | `string` | A detailed description of the step |
| subscribes | `string[]` | List of topics this step listens to |
| emits | `string[]` | List of topics this step emits |
| language | `string` | The programming language used |

</Callout>

### ApiNode

Specialized component for API-related steps.

| Prop | Type | Description |
|------|------|-------------|
| data | `ApiNodeProps['data']` | API step data |
| className | `string` | Additional CSS classes |

<Tabs items={['TypeScript', 'JavaScript']}>
  <Tab>
    ```typescript
    // apiStep.step.tsx

    import React from 'react'
    import { ApiNode } from 'motia/workbench'
    import type { ApiNodeProps } from 'motia/workbench'

    export default function ApiStep({ data }: ApiNodeProps) {
      return (
        <ApiNode
          data={data}
          className="border-blue-500"
        >
          <div>API endpoint: {data.name}</div>
        </ApiNode>
      )
    }
    ```
  </Tab>
  <Tab>
    ```javascript
    // apiStep.step.jsx

    import React from 'react'
    import { ApiNode } from 'motia/workbench'

    export default function ApiStep({ data }) {
      return (
        <ApiNode
          data={data}
          className="border-blue-500"
        >
          <div>API endpoint: {data.name}</div>
        </ApiNode>
      )
    }
    ```
  </Tab>
</Tabs>

<Callout type="info">
The `ApiNodeProps` type provides essential information about your step. Here are the key properties:

| Property | Type | Description |
|----------|------|-------------|
| type | `string` | The type of the step |
| name | `string` | The name of the step |
| description | `string` | A detailed description of the step |
| emits | `string[]` | List of topics this step emits |
| subscribes | `string[]` | List of topics this step listens to |
| webhookUrl | `string` | The URL of the webhook |
| bodySchema | `JSONSchema7` | The schema of the body of the request |

</Callout>

## Styling Guidelines

| Guideline | Description |
|-----------|-------------|
| Use Tailwind's utility classes only | Stick to Tailwind CSS utilities for consistent styling |
| Avoid arbitrary values | Use predefined scales from the design system |
| Keep components responsive | Ensure UI elements adapt well to different screen sizes |
| Follow Motia's design system | Maintain consistency with Motia's established design patterns |

<Callout type="info">
  Custom styles should be minimal and consistent with the overall Workbench UI.
</Callout>

## Best Practices

| Practice | Description |
|----------|-------------|
| Use base components | Use `EventNode` and `ApiNode` when possible |
| Keep it simple | Maintain simple and clear visualizations |
| Optimize performance | Minimize state and computations |
| Documentation | Document custom components and patterns |
| Style sharing | Share common styles through utility classes |
