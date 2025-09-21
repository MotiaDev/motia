import { StepConfig, Handlers } from 'motia'

export const config: StepConfig = {
  name: 'HandlePeriodicJob',
  description: 'Handles the periodic job event',
  triggers: [{
    type: 'cron',
    cron: '0 */1 * * *',
  }],
  cron: '0 */1 * * *',
  emits: ['periodic-job-handled'],
  flows: ['cron-example'],
}

export const handler: Handlers['HandlePeriodicJob'] = async ({ logger, emit }) => {
  logger.info('Periodic job executed')

  await emit({
    topic: 'periodic-job-handled',
    data: { message: 'Periodic job executed' },
  })
}
