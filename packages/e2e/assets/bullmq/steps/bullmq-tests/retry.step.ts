import type { EventConfig, Handlers } from 'motia'
import { baseEventSchema } from './types'
import { incrementAttempts, recordResult } from './utils'

export const config: EventConfig = {
  type: 'event',
  name: 'BullMQRetryConsumer',
  description: 'Fails until configured attempts to exercise retry and DLQ paths',
  flows: ['bullmq-tests'],
  subscribes: ['bullmq.tests.retry'],
  emits: ['bullmq.tests.retry'],
  infrastructure: {
    queue: {
      type: 'standard',
      maxRetries: 2,
      visibilityTimeout: 5,
      delaySeconds: 0,
    },
  },
}

export const handler: Handlers['BullMQRetryConsumer'] = async (input, { state }) => {
  const parsed = baseEventSchema.parse(input)
  const { testCaseId, failUntilAttempt, ...payload } = parsed

  const attempt = await incrementAttempts(state, testCaseId)

  await recordResult(state, testCaseId, {
    step: 'retry-consumer',
    eventTopic: 'bullmq.tests.retry',
    payload,
    metadata: { attempt },
  })

  if (failUntilAttempt !== undefined && attempt <= failUntilAttempt) {
    throw new Error(`Forced failure for attempt ${attempt}`)
  }
}
