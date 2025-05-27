---
title: Cron Step
---

The **Cron Step** allows you to schedule your steps to run at specified intervals. It is a powerful tool for automating your business logic.

## Config

The following properties are specific to the Cron Step, in addition to the [common step config](/docs/concepts/steps/defining-steps#config).

<DescriptionTable
  type={{
    cron: {
      description: 'The cron schedule expression for your step',
      type: 'string',
    },
  }}
/>

The following examples showcase how to configure an **CRON Step**

<Tabs  items={['TS', 'JS', 'Python']}>
  <Tab value="TS">
    ```typescript
    import { CronConfig, Handlers } from 'motia'

    export const config: CronConfig = {
      type: 'cron' as const,
      name: 'PeriodicJob',
      description: 'Runs every minute and emits a timestamp',
      cron: '0 * * * *', // run every hour at minute 0
      emits: ['cron-ticked'],
      flows: ['cron-example'],
    }

    export const handler: Handlers['PeriodicJob'] = async ({ emit }) => {
      await emit({
        topic: 'cron-ticked',
        data: { message: 'Cron job executed' },
      })
    }
    ```

  </Tab>
  <Tab value="JS">
    ```javascript
    const config = {
      type: 'cron',
      name: 'PeriodicJob',
      description: 'Runs every minute and emits a timestamp',
      cron: '0 * * * *', // run every hour at minute 0
      emits: ['cron-ticked'],
      flows: ['cron-example'],
    };

    const handler = async ({ emit }) => {
      await emit({
        topic: 'cron-ticked',
        data: { message: 'Cron job executed' },
      })
    }

    ```

  </Tab>
  <Tab value="Python">
    ```python
    config = {
        "type": "cron",
        "name": "PeriodicJob",
        "description": "Runs every minute and emits a timestamp",
        "cron": "0 * * * *",
        "emits": ["cron-ticked"],
        "flows": ["cron-example"]
    }
  
    async def handler(context):
        await context.emit({
            "topic": "cron-ticked",
            "data": { "message": "Cron job executed" },
        })

    ```
  </Tab>
</Tabs>
