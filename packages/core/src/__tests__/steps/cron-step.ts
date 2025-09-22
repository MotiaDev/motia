import { StepConfig, CronHandler, FlowContext } from '../../types'

export const config: StepConfig = {
  name: 'cron-step',
  triggers: [{
    type: 'cron',
    cron: '* * * * *', // Run every minute
  }],
  emits: ['TEST_EVENT'],
  cron: '* * * * *', // Run every minute
}

type EmitData = { topic: 'TEST_EVENT'; data: { test: string } }

export const handler: CronHandler<EmitData> = async (ctx: FlowContext<EmitData>) => {
  await ctx.emit({ data: { test: 'data' }, topic: 'TEST_EVENT' })
}
