import { type Handlers, jsonSchema, type StepConfig } from '@iii-dev/motia'
import { z } from 'zod'

export const config = {
  name: 'PeriodicJobHandled',
  description: 'Handles the periodic job event',
  triggers: [
    {
      type: 'event',
      topic: 'periodic-job-handled',
      input: jsonSchema(
        z.object({
          message: z.string(),
        }),
      ),
    },
  ],
  emits: ['tested'],
  flows: ['cron-example'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { logger }) => {
  logger.info('Periodic job executed', { input })
}
