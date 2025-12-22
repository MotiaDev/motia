import {
  createBullMQTestCaseId,
  emitBullMQEvent,
  resetBullMQTestCase,
  waitForBullMQResults,
} from '@/src/bullmq-test-utils'
import { expect, test } from '@/src/motia-fixtures'
import type { ApiHelpers } from '@/src/page-objects/ApiHelpers'

const DELAYED_QUEUE = 'bullmq.tests.delayed.BullMQDelayedConsumer'

const listJobs = async (api: ApiHelpers, status: string) => {
  const response = await api.get(
    `/__motia/bullmq/queues/${encodeURIComponent(DELAYED_QUEUE)}/jobs?status=${status}&start=0&end=5`,
  )
  expect(response.ok).toBeTruthy()
  const body = (await api.getResponseJson(response)) as any
  return (body?.jobs ?? []) as Array<{ id: string }>
}

test.describe('BullMQ Plugin API - Jobs', () => {
  test.beforeEach(async ({ helpers }) => helpers.skipTutorial())

  test('lists, promotes, and removes jobs', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.delayed',
      testCaseId,
      payload: { marker: 'jobs-api' },
    })

    const delayedJobs = await listJobs(api, 'delayed')
    expect(delayedJobs.length).toBeGreaterThan(0)
    const jobId = delayedJobs[0].id

    const detailResponse = await api.get(
      `/__motia/bullmq/queues/${encodeURIComponent(DELAYED_QUEUE)}/jobs/${encodeURIComponent(jobId)}`,
    )
    expect(detailResponse.ok).toBeTruthy()

    const promoteResponse = await api.post(
      `/__motia/bullmq/queues/${encodeURIComponent(DELAYED_QUEUE)}/jobs/${encodeURIComponent(jobId)}/promote`,
    )
    expect(promoteResponse.ok).toBeTruthy()

    await waitForBullMQResults(api, testCaseId, (items) => items.length === 1)

    const removeResponse = await api.post(
      `/__motia/bullmq/queues/${encodeURIComponent(DELAYED_QUEUE)}/jobs/${encodeURIComponent(jobId)}/remove`,
    )
    expect(removeResponse.ok).toBeTruthy()
  })
})
