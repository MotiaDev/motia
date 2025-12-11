import type { EventConfig, Handlers } from 'motia'
import { baseEventSchema } from './types'
import { recordResult } from './utils'

export const config: EventConfig = {
  type: 'event',
  name: 'BullMQStandardSecondary',
  description: 'Secondary subscriber for bullmq.tests.standard topic',
  flows: ['bullmq-tests'],
  subscribes: ['bullmq.tests.standard'],
  emits: ['bullmq.tests.standard'],
}

export const handler: Handlers['BullMQStandardSecondary'] = async (input, { state }) => {
  const parsed = baseEventSchema.parse(input)
  const { testCaseId, ...payload } = parsed

  await recordResult(state, testCaseId, {
    step: 'standard-secondary',
    eventTopic: 'bullmq.tests.standard',
    subscriber: 'secondary',
    payload,
  })
}
