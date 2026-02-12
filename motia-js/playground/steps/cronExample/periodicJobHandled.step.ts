import { type Handlers, jsonSchema, type StepConfig } from 'motia'
import { z } from 'zod'

export const config = {
  name: 'PeriodicJobHandled',
  description: 'Handles the periodic job event',
  triggers: [
    {
      type: 'queue',
      topic: 'periodic-job-handled',
      input: jsonSchema(
        z.object({
          message: z.string(),
        }),
      ),
    },
  ],
  enqueues: ['tested'],
  flows: ['cron-example'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { logger }) => {
  logger.info('Periodic job executed', { input })
}
