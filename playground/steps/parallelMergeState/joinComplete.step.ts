import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

const stepSchema = z.object({ msg: z.string(), timestamp: z.number() })

export const config: StepConfig = {
  name: 'JoinComplete',
  description: 'Logs the merge',
  triggers: [{
    type: 'event',
    topic: 'pms.join.complete',
  }],
  emits: [],
  input: z.object({ stepA: stepSchema, stepB: stepSchema, stepC: stepSchema, mergedAt: z.string() }),
  flows: ['parallel-merge'],
}

export const handler: Handlers['JoinComplete'] = async (input, { logger }) => {
  logger.info('[Join Complete] Handling Join Complete', { input })
}
