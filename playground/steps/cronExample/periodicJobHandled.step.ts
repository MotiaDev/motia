import type { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'PeriodicJobHandled',
  description: 'Handles the periodic job event',
  subscribes: ['periodic-job-handled'],
  input: z.object({
    message: z.string(),
  }),
  emits: ['tested'],
  flows: ['cron-example'],
}

export const handler: Handlers['PeriodicJobHandled'] = async (input, { logger }) => {
  logger.info('Periodic job executed', { input })
}
