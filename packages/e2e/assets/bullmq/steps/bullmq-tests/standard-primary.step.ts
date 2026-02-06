import type { EventConfig, Handlers } from 'motia'
import { baseEventSchema } from './types'
import { recordResult } from './utils'

export const config: EventConfig = {
  type: 'event',
  name: 'BullMQStandardPrimary',
  description: 'Primary subscriber for bullmq.tests.standard topic',
  flows: ['bullmq-tests'],
  subscribes: ['bullmq.tests.standard'],
  emits: ['bullmq.tests.standard'],
}

export const handler: Handlers['BullMQStandardPrimary'] = async (input, { state }) => {
  const parsed = baseEventSchema.parse(input)
  const { testCaseId, ...payload } = parsed

  await recordResult(state, testCaseId, {
    step: 'standard-primary',
    eventTopic: 'bullmq.tests.standard',
    subscriber: 'primary',
    payload,
  })
}
