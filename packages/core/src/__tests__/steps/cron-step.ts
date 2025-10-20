import type { CronConfig, CronHandler } from '../../types'

export const config: CronConfig = {
  type: 'cron',
  name: 'cron-step',
  emits: [],
  cron: '* * * * *',
}

export const handler: CronHandler<never> = async () => {}
