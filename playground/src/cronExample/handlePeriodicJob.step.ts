import type { CronConfig, Handlers } from 'motia'
import { CronExpression } from 'motia'

export const config: CronConfig = {
  type: 'cron',
  name: 'HandlePeriodicJob',
  description: 'Handles the periodic job event',
  //Cron expression can be string or CronExpression enum
  //cron: "*/1 * * * *" or cron: CronExpression.EVERY_MINUTE
  cron: CronExpression.EVERY_MINUTE,
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
