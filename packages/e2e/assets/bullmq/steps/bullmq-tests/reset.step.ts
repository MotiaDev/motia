import type { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { clearResults, resetAttempts } from './utils'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'BullMQTestsReset',
  description: 'Reset BullMQ test state for a given test case id',
  flows: ['bullmq-tests'],
  method: 'POST',
  path: '/bullmq-tests/reset',
  emits: ['bullmq.tests.reset'],
  bodySchema: z.object({
    testCaseId: z.string(),
  }),
  responseSchema: {
    200: z.object({
      cleared: z.literal(true),
      testCaseId: z.string(),
    }),
  },
}

export const handler: Handlers['BullMQTestsReset'] = async (req, { state }) => {
  const { testCaseId } = req.body
  await clearResults(state, testCaseId)
  await resetAttempts(state, testCaseId)

  return { status: 200, body: { cleared: true, testCaseId } }
}
