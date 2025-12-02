import type { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { listResults } from './utils'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'BullMQTestsResults',
  description: 'Read BullMQ test execution artifacts from state',
  flows: ['bullmq-tests'],
  method: 'GET',
  path: '/bullmq-tests/results/:testCaseId',
  emits: [],
  responseSchema: {
    200: z.object({
      testCaseId: z.string(),
      results: z.array(
        z.object({
          testCaseId: z.string(),
          step: z.string(),
          eventTopic: z.string(),
          subscriber: z.string().optional(),
          payload: z.unknown().optional(),
          recordedAt: z.string(),
          metadata: z.record(z.string(), z.any()).optional(),
        }),
      ),
    }),
  },
}

export const handler: Handlers['BullMQTestsResults'] = async (req, { state }) => {
  const testCaseId = req.pathParams.testCaseId as string
  const results = await listResults(state, testCaseId)

  return {
    status: 200,
    body: { testCaseId, results },
  }
}
