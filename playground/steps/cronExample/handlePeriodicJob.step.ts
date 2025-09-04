import type { CronConfig, Handlers } from 'motia'

export const config: CronConfig = {
  type: 'cron',
  name: 'HandlePeriodicJob',
  description: 'Handles the periodic job event',
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
