import type { EventConfig, Handlers } from 'motia'
import { baseEventSchema } from './types'
import { recordResult } from './utils'

const configuredDelaySeconds = 2

export const config: EventConfig = {
  type: 'event',
  name: 'BullMQDelayedConsumer',
  description: 'Processes events after a configured queue-level delay',
  flows: ['bullmq-tests'],
  subscribes: ['bullmq.tests.delayed'],
  emits: ['bullmq.tests.delayed'],
  infrastructure: {
    queue: {
      type: 'standard',
      maxRetries: 1,
      visibilityTimeout: 10,
      delaySeconds: configuredDelaySeconds,
    },
  },
}

export const handler: Handlers['BullMQDelayedConsumer'] = async (input, { state }) => {
  const parsed = baseEventSchema.parse(input)
  const { testCaseId, ...payload } = parsed

  await recordResult(state, testCaseId, {
    step: 'delayed-consumer',
    eventTopic: 'bullmq.tests.delayed',
    payload,
    metadata: {
      configuredDelaySeconds,
      receivedTimestamp: Date.now(),
    },
  })
}
