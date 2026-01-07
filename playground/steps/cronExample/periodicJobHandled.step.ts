import { type EventConfig, type Handlers, jsonSchema } from '@iii-dev/motia'
import { z } from 'zod'

export const config = {
  type: 'event',
  name: 'PeriodicJobHandled',
  description: 'Handles the periodic job event',
  subscribes: ['periodic-job-handled'],
  input: jsonSchema(
    z.object({
      message: z.string(),
    }),
  ),
  emits: ['tested'],
  flows: ['cron-example'],
} as const satisfies EventConfig

export const handler: Handlers<typeof config> = async (input, { logger }) => {
  logger.info('Periodic job executed', { input })
}
