import type { EventConfig, Handlers } from 'motia'
import { baseEventSchema } from './types'
import { recordResult } from './utils'

export const config: EventConfig = {
  type: 'event',
  name: 'BullMQFifoConsumer',
  description: 'Processes FIFO jobs sequentially for ordering guarantees',
  flows: ['bullmq-tests'],
  subscribes: ['bullmq.tests.fifo'],
  emits: ['bullmq.tests.fifo'],
  infrastructure: {
    queue: {
      type: 'fifo',
      maxRetries: 1,
      visibilityTimeout: 10,
      delaySeconds: 0,
    },
  },
}

export const handler: Handlers['BullMQFifoConsumer'] = async (input, { state }) => {
  const parsed = baseEventSchema.parse(input)
  const { testCaseId, sequence, ...payload } = parsed

  await recordResult(state, testCaseId, {
    step: 'fifo-consumer',
    eventTopic: 'bullmq.tests.fifo',
    payload: { ...payload, sequence },
    metadata: { sequence },
  })
}
