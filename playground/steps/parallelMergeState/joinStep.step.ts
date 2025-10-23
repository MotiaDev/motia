import type { EventConfig, Handlers } from 'motia'
import { z } from 'zod'
import type { ParallelMergeStep } from './parallelMerge.types'

export const config: EventConfig = {
  type: 'event',
  name: 'join-step',
  description: 'Merges the results of parallel steps',
  subscribes: ['pms.stepA.done', 'pms.stepB.done', 'pms.stepC.done'],
  emits: ['pms.join.complete'],
  input: z.object({ msg: z.string(), timestamp: z.number() }),
  flows: ['parallel-merge'],
}

export const handler: Handlers['join-step'] = async (input, { emit, traceId, state, logger }) => {
  logger.info('[join-step] Handling Join Step', { input })

  const stepA = await state.get<ParallelMergeStep>(traceId, 'stepA')
  const stepB = await state.get<ParallelMergeStep>(traceId, 'stepB')
  const stepC = await state.get<ParallelMergeStep>(traceId, 'stepC')

  if (!stepA || !stepB || !stepC) {
    logger.info('[join-step] Not all steps done yet, ignoring for now.', { stepA, stepB, stepC })
    return
  }

  logger.info('[join-step] All steps are complete. Merging results...', { stepA, stepB, stepC })

  const mergedAt = new Date().toISOString()
  const merged = { stepA, stepB, stepC, mergedAt }

  await emit({ topic: 'pms.join.complete', data: merged })
  await state.clear(traceId)
}
