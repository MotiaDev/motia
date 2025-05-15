---
title: Defining Steps
---

Steps are the fundamental building blocks in Motia that encapsulate isolated pieces of business logic. 

Steps have two core behaviors:

1. **Event Subscription**: Steps can subscribe to specific topics, allowing them to listen and react to particular events.
2. **Event Emission**: Steps can emit new topics, triggering an event for other steps to react to.

Steps can operate in two different patterns:
- **Independent**: Each step can function as a standalone unit, processing its logic in isolation.
- **Flow**: Steps can be connected together in a sequence, creating a **flow** where the output of one step becomes the input for another.

This modular approach allows you to:
- Build reusable components of business logic
- Create complex workflows by combining simple steps
- Maintain clear separation of concerns
- Scale and modify parts of your system independently

Steps can be defined in any language that Motia supports, such as TypeScript, JavaScript, Python, and Ruby. Steps can be of type [`event`](/docs/concepts/steps/event), [`api`](/docs/concepts/steps/api), or [`cron`](/docs/concepts/steps/cron). Steps are composed of a `config` object and a `handler` function.

## Config

A step's configuration is defined through a `config` object that must be exported. This object contains essential properties that tell Motia how to interact with the step.

<DescriptionTable
  type={{
    type: {
      description: 'The step type: event, api, or cron',
      type: 'string',
    },
    name: {
      description: 'A unique identifier for the step, used in Motia Workbench visualization tool',
      type: 'string',
    },
    subscribes: {
      description: 'A list of topics this step listens to',
      type: 'string[]',
      default: []
    },
    emits: {
      description: 'A list of topics this step can emit',
      type: 'string[]',
    },
    flows: {
      description: 'A list of flow identifiers that this step belongs to',
      type: 'string[]',
    },
    description: {
      description: 'Optional description for documentation and visualization',
      type: 'string',
    }
  }}
/>

Each step type has its own set of properties, specific to that step type, which are described in the following sections.

<Breadcrumb items={[{
  name: 'Event Steps',
  url: '/docs/concepts/steps/event'
}, {
  name: 'API Steps',
  url: '/docs/concepts/steps/api'
}, {
  name: 'Cron Steps',
  url: '/docs/concepts/steps/cron'
}]} />

## Handler

A handler holds the business logic of a step. When an event occurs that matches the step's subscribed topics, the handler automatically runs with two key pieces of information:

1. The input data from the triggering event
2. A context object that provides useful tools:
   - `emit`: Sends new events to other steps
   - `traceId`: Helps track the flow of operations
   - `state`: Manages data persistence
   - `logger`: Records important information

Here're examples of how to define a handler in the Motia supported languages:

<Tabs items={['TS', 'JS', 'Python', 'Ruby']}>
  <Tab value="TS">
    ```typescript
    import { EventConfig, StepHandler } from 'motia'

    export const config: EventConfig = {
      type: 'event',
      name: 'Minimal Step',
      subscribes: ['start'],
      emits: ['done'],
    }

    export const handler: StepHandler<typeof config> = async (input, { emit, traceId, state, logger }) => {
      await emit({ topic: 'done', data: {} })
    }
    ```
  </Tab>
  <Tab value="JS">
    ```javascript
    exports.config = {
      type: 'event',
      name: 'Minimal Step',
      subscribes: ['start'],
      emits: ['done'],
    }

    exports.handler = async (input, { emit, traceId, state, logger }) => {
      await emit({ topic: 'done', data: {} })
    }
    ```
  </Tab>
  <Tab value="Python">
    ```python
    config = {
        'type': 'event',
        'name': 'Minimal Step',
        'subscribes': ['start'],
        'emits': ['done'],
    }

    async def handler(args, ctx):
      await ctx.emit({'topic': 'done', 'data': {}})
    ```
  </Tab>
  <Tab value="Ruby">
    ```ruby
    def config
      {
        type: 'event',
        name: 'Minimal Step',
        subscribes: ['start'],
        emits: ['done'],
      }
    end

    def handler(args, ctx)
      ctx.emit({topic: 'done', data: {}})
    end
    ```
  </Tab>
</Tabs>

<Callout>
Follow the **[quick start](/docs/getting-started/quick-start)** guide if you haven't set up Motia yet.
</Callout>
