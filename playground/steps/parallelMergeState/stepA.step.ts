import type { EventConfig, Handlers } from 'motia'
import { z } from 'zod'
import type { ParallelMergeStep } from './parallelMerge.types'

export const config: EventConfig = {
  type: 'event',
  name: 'stepA',
  description: 'Hello from Step A',
  subscribes: ['pms.start'],
  emits: ['pms.stepA.done'],
  input: z.object({}),
  flows: ['parallel-merge'],
}

export const handler: Handlers['stepA'] = async (_, { emit, traceId, state, logger }) => {
  logger.info('[stepA] received pms.start')

  await new Promise((resolve) => setTimeout(resolve, 300))

  const partialResultA: ParallelMergeStep = { msg: 'Hello from Step A', timestamp: Date.now() }
  await state.set<ParallelMergeStep>(traceId, 'stepA', partialResultA)

  await emit({
    topic: 'pms.stepA.done',
    data: partialResultA,
  })
}
