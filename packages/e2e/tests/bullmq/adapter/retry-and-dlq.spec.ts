import {
  createBullMQTestCaseId,
  emitBullMQEvent,
  resetBullMQTestCase,
  waitForBullMQResults,
} from '@/src/bullmq-test-utils'
import { expect, test } from '@/src/motia-fixtures'
import type { ApiHelpers } from '@/src/page-objects/ApiHelpers'

const RETRY_QUEUE = 'bullmq.tests.retry.BullMQRetryConsumer'
const DLQ_QUEUE = `${RETRY_QUEUE}.dlq`

const waitForDlqJob = async (api: ApiHelpers, testCaseId: string) => {
  const timeoutMs = 20000
  const intervalMs = 1000
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const response = await api.get(`/__motia/bullmq/dlq/${encodeURIComponent(RETRY_QUEUE)}/jobs`)
    const body = (await api.getResponseJson(response)) as any
    const jobs = (body?.jobs ?? []) as Array<{ data?: { originalEvent?: { data?: { testCaseId?: string } } } }>
    const match = jobs.find((job) => job.data?.originalEvent?.data?.testCaseId === testCaseId)
    if (match) {
      return match
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(`Timed out waiting for DLQ job for ${testCaseId}`)
}

test.describe('BullMQ Adapter - Retry & DLQ', () => {
  test.beforeEach(async ({ helpers }) => helpers.skipTutorial())

  test('retries failing jobs until successful', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.retry',
      testCaseId,
      payload: { failUntilAttempt: 1 },
      messageGroupId: testCaseId,
    })

    const results = await waitForBullMQResults(
      api,
      testCaseId,
      (items) => items.filter((item) => item.metadata?.attempt !== undefined).length >= 2,
    )

    const attemptMetadata = results
      .map((item) => item.metadata?.attempt)
      .filter((value): value is number => typeof value === 'number')
    const attemptsSeen = Array.from(new Set(attemptMetadata)).sort((a, b) => a - b)
    expect(attemptsSeen).toEqual([1, 2])
  })

  test('moves jobs to DLQ after exhausting retries', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.retry',
      testCaseId,
      payload: { failUntilAttempt: 5 },
      messageGroupId: `${testCaseId}-dlq`,
    })

    const job = await waitForDlqJob(api, testCaseId)
    expect(job).toBeDefined()

    const clearResponse = await api.post(`/__motia/bullmq/dlq/${encodeURIComponent(RETRY_QUEUE)}/clear`)
    expect(clearResponse.ok).toBeTruthy()
  })
})
