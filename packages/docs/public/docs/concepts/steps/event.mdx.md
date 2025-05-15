---
title: Event Step
---

The **Event Step** lets you define custom logic in response to subscribed events and at the same time trigger other steps by emitting new events. It enables communication between different parts of your flow.

## Config

The following properties are specific to the Event Step, in addition to the [common step config](/docs/concepts/steps/defining-steps#config).

<DescriptionTable
  type={{
    input: {
      description:
        'This is used for input validation. For TypeScript/JavaScript steps, it uses zod schemas. For Python steps, it uses Pydantic models. This validates the input before executing the step handler.',
      type: 'string[]',
    },
  }}
/>

The following examples showcase how to configure an **Event Step**

<Tabs  items={['TS', 'JS', 'Python', 'Ruby']}>
  <Tab value="TS">
    ```typescript
    import { EventConfig, StepHandler } from 'motia'
    import { z } from 'zod'

    const inputSchema = z.object({
      message: z.string()
    })

    type Input = typeof inputSchema

    export const config: EventConfig<Input> = {
      type: 'event',
      name: 'stepA',
      description: 'Hello from Step A',
      subscribes: ['pms.start'],
      emits: ['pms.stepA.done'],
      input: inputSchema,
      flows: ['parallel-merge'],
    }

    export const handler: StepHandler<typeof config> = async (input, { emit, logger }) => {
      logger.info('Processing message:', input.message)

      await emit({
        topic: 'pms.stepA.done',
        data: {
          result: `Processed: ${input.message}`
        }
      })
    }
    ```

  </Tab>
  <Tab value="JS">
    ```javascript
    const z = require('zod');

    const inputSchema = z.object({
      message: z.string()
    });

    const config = {
      type: 'event',
      name: 'stepA',
      description: 'Hello from Step A',
      subscribes: ['pms.start'],
      emits: ['pms.stepA.done'],
      input: inputSchema,
      flows: ['parallel-merge'],
    };

    const handler = async (input, { emit, logger }) => {
      logger.info('Processing message:', input.message)

      await emit({
        topic: 'pms.stepA.done',
        data: {
          result: `Processed: ${input.message}`
        }
      })
    };

    module.exports = { config, handler };
    ```

  </Tab>
  <Tab value="Python">
    ```python
    from pydantic import BaseModel
    
    # Define a Pydantic model for input validation
    class InputModel(BaseModel):
        message: str
    
    config = {
        "type": "event",
        "name": "Call OpenAI",
        "subscribes": ["call-openai"], 
        "emits": ["openai-response"],
        "input": InputModel.model_json_schema(), # We use jsonschema to validate
        "flows": ["openai"]
    }

    async def handler(input, context):
        context.logger.info('Processing input:', input)

        await context.emit({
            "topic": "openai-response",
            "data": {
                "result": f"Processed: {input.get('message', '')}"
            }
        })
    ```

  </Tab>
  <Tab value="Ruby">
    ```ruby
    class Config
      attr_reader :type, :name, :subscribes, :emits, :input, :flows

      def initialize
        @type = "event"
        @name = "Call OpenAI"
        @subscribes = ["call-openai"]
        @emits = ["openai-response"]
        @input = nil # No schema validation
        @flows = ["openai"]
      end
    end

    config = Config.new

    def handler(input, context)
      context.logger.info("Processing input: #{input}")

      context.emit({
        topic: "openai-response",
        data: {
          result: "Processed: #{input[:message]}"
        }
      })
    end
    ```

  </Tab>
</Tabs>

## Example
