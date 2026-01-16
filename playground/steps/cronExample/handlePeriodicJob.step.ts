import type { Handlers, StepConfig } from '@iii-dev/motia'

export const config = {
  name: 'HandlePeriodicJob',
  description: 'Handles the periodic job event',
  triggers: [
    {
      type: 'cron',
      expression: '0 */1 * * *',
    },
  ],
  emits: ['periodic-job-handled'],
  flows: ['cron-example'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { logger, emit }) => {
  logger.info('Periodic job executed')

  await emit({
    topic: 'periodic-job-handled',
    data: { message: 'Periodic job executed' },
  })
}
