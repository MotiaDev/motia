import { CronConfig, CronHandler, FlowContext } from '../../types'

export const config: CronConfig = {
  type: 'cron',
  name: 'cron-step',
  emits: ['TEST_EVENT'],
  cron: '* * * * *', // Run every minute
}

type EmitData = { topic: 'TEST_EVENT'; data: { test: string } }

export const handler: CronHandler<EmitData> = async (ctx: FlowContext<EmitData>) => {
  await ctx.emit({ data: { test: 'data' }, topic: 'TEST_EVENT' })
}
