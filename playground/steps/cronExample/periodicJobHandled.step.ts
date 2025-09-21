import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'PeriodicJobHandled',
  description: 'Handles the periodic job event',
  triggers: [{
    type: 'event',
    topic: 'periodic-job-handled',
  }],
  input: z.object({
    message: z.string(),
  }),
  emits: ['tested'],
  flows: ['cron-example'],
}

export const handler: Handlers['PeriodicJobHandled'] = async (input, { logger }) => {
  logger.info('Periodic job executed', { input })
}
