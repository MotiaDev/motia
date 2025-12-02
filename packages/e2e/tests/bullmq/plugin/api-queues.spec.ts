import {
  createBullMQTestCaseId,
  emitBullMQEvent,
  resetBullMQTestCase,
  waitForBullMQResults,
} from '@/src/bullmq-test-utils'
import { expect, test } from '@/src/motia-fixtures'
import type { ApiHelpers } from '@/src/page-objects/ApiHelpers'

const STANDARD_QUEUE = 'bullmq.tests.standard.BullMQStandardPrimary'

type QueueDetail = {
  isPaused: boolean
}

const fetchQueueDetail = async (api: ApiHelpers, queueName: string): Promise<QueueDetail> => {
  const response = await api.get(`/__motia/bullmq/queues/${encodeURIComponent(queueName)}`)
  expect(response.ok).toBeTruthy()
  const body = await api.getResponseJson(response)
  return body as QueueDetail
}

test.describe('BullMQ Plugin API - Queues', () => {
  test.beforeEach(async ({ helpers }) => helpers.skipTutorial())

  test('lists queues with stats and allows pause/resume/clean operations', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)
    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.standard',
      testCaseId,
      payload: { check: 'queues' },
    })
    await waitForBullMQResults(api, testCaseId, (items) => items.length >= 2)

    const listResponse = await api.get('/__motia/bullmq/queues')
    const body = (await api.getResponseJson(listResponse)) as any
    const queues = body?.queues ?? []
    const standardQueue = queues.find((queue: any) => queue.name === STANDARD_QUEUE)

    expect(standardQueue).toBeDefined()
    expect(standardQueue.stats.completed).toBeGreaterThanOrEqual(1)

    await api.post(`/__motia/bullmq/queues/${encodeURIComponent(STANDARD_QUEUE)}/pause`)
    let detail = await fetchQueueDetail(api, STANDARD_QUEUE)
    expect(detail.isPaused).toBeTruthy()

    await api.post(`/__motia/bullmq/queues/${encodeURIComponent(STANDARD_QUEUE)}/resume`)
    detail = await fetchQueueDetail(api, STANDARD_QUEUE)
    expect(detail.isPaused).toBeFalsy()

    const cleanResponse = await api.post(`/__motia/bullmq/queues/${encodeURIComponent(STANDARD_QUEUE)}/clean`, {
      status: 'completed',
      limit: 100,
      grace: 0,
    })
    expect(cleanResponse.ok).toBeTruthy()
  })
})
