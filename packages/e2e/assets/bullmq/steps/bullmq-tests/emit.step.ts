import type { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

const topics = ['bullmq.tests.standard', 'bullmq.tests.retry', 'bullmq.tests.delayed', 'bullmq.tests.fifo'] as const

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'BullMQTestsEmit',
  description: 'Emit BullMQ test events with contextual metadata',
  flows: ['bullmq-tests'],
  method: 'POST',
  path: '/bullmq-tests/emit',
  emits: topics,
  bodySchema: z.object({
    topic: z.enum(topics),
    testCaseId: z.string(),
    payload: z.record(z.string(), z.any()).optional(),
    messageGroupId: z.string().optional(),
  }),
  responseSchema: {
    202: z.object({
      enqueued: z.literal(true),
      topic: z.string(),
      testCaseId: z.string(),
      messageGroupId: z.string().optional(),
    }),
  },
}

export const handler: Handlers['BullMQTestsEmit'] = async (req, { emit, traceId, flows }) => {
  const { topic, testCaseId, payload, messageGroupId } = req.body

  await emit({
    topic,
    data: {
      ...(payload ?? {}),
      testCaseId,
    },
    traceId,
    flows,
    ...(messageGroupId ? { messageGroupId } : {}),
  })

  return {
    status: 202,
    body: {
      enqueued: true,
      topic,
      testCaseId,
      ...(messageGroupId ? { messageGroupId } : {}),
    },
  }
}
