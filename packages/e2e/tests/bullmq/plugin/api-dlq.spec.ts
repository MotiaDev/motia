import {
  createBullMQTestCaseId,
  emitBullMQEvent,
  resetBullMQTestCase,
  waitForBullMQResults,
} from '@/src/bullmq-test-utils'
import { expect, test } from '@/src/motia-fixtures'
import type { ApiHelpers } from '@/src/page-objects/ApiHelpers'

const RETRY_QUEUE = 'bullmq.tests.retry.BullMQRetryConsumer'

const findDlqJob = async (api: ApiHelpers, testCaseId: string) => {
  const response = await api.get(`/__motia/bullmq/dlq/${encodeURIComponent(RETRY_QUEUE)}/jobs`)
  expect(response.ok).toBeTruthy()
  const body = (await api.getResponseJson(response)) as any
  const jobs = (body?.jobs ?? []) as Array<{
    id: string
    data?: { originalEvent?: { data?: { testCaseId?: string } } }
  }>
  return jobs.find((job) => job.data?.originalEvent?.data?.testCaseId === testCaseId)
}

const waitForDlqJob = async (api: ApiHelpers, testCaseId: string) => {
  const start = Date.now()
  while (Date.now() - start < 20000) {
    const job = await findDlqJob(api, testCaseId)
    if (job) {
      return job
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`DLQ job not found for ${testCaseId}`)
}

test.describe('BullMQ Plugin API - DLQ', () => {
  test.beforeEach(async ({ helpers }) => helpers.skipTutorial())

  test('retries a single DLQ job', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.retry',
      testCaseId,
      payload: { failUntilAttempt: 5 },
      messageGroupId: `${testCaseId}-single`,
    })

    const job = await waitForDlqJob(api, testCaseId)
    expect(job).toBeDefined()

    const retryResponse = await api.post(
      `/__motia/bullmq/dlq/${encodeURIComponent(RETRY_QUEUE)}/retry/${encodeURIComponent(job!.id)}`,
    )
    expect(retryResponse.ok).toBeTruthy()

    await waitForBullMQResults(api, testCaseId, (items) => items.length >= 1)
  })

  test('retries all DLQ jobs and clears queue', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.retry',
      testCaseId,
      payload: { failUntilAttempt: 4 },
      messageGroupId: `${testCaseId}-all`,
    })

    await waitForDlqJob(api, testCaseId)

    const retryAllResponse = await api.post(`/__motia/bullmq/dlq/${encodeURIComponent(RETRY_QUEUE)}/retry-all`)
    expect(retryAllResponse.ok).toBeTruthy()

    await waitForBullMQResults(api, testCaseId, (items) => items.length >= 1)

    const clearResponse = await api.post(`/__motia/bullmq/dlq/${encodeURIComponent(RETRY_QUEUE)}/clear`)
    expect(clearResponse.ok).toBeTruthy()
  })
})
