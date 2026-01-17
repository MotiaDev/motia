import {
  createBullMQTestCaseId,
  emitBullMQEvent,
  resetBullMQTestCase,
  waitForBullMQResults,
} from '@/src/bullmq-test-utils'
import { expect, test } from '@/src/motia-fixtures'

test.describe('BullMQ Adapter - Queue Configuration', () => {
  test.beforeEach(async ({ helpers }) => helpers.skipTutorial())

  test('honors queue-level delays before executing jobs', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    const enqueuedAt = Date.now()
    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.delayed',
      testCaseId,
      payload: { note: 'delay-check' },
    })

    const results = await waitForBullMQResults(api, testCaseId, (items) => items.length === 1)
    const receivedTimestamp = results[0]?.metadata?.receivedTimestamp as number

    expect(receivedTimestamp - enqueuedAt).toBeGreaterThanOrEqual(1500)
  })

  test('processes FIFO queues sequentially', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    await Promise.all(
      [1, 2, 3, 4].map((sequence) =>
        emitBullMQEvent(api, {
          topic: 'bullmq.tests.fifo',
          testCaseId,
          payload: { sequence },
          messageGroupId: `${testCaseId}-${sequence}`,
        }),
      ),
    )

    const results = await waitForBullMQResults(
      api,
      testCaseId,
      (items) => items.filter((item) => typeof item.metadata?.sequence === 'number').length >= 4,
    )
    const sequences = results
      .map((item) => item.metadata?.sequence)
      .filter((value): value is number => typeof value === 'number')
    const distinctSequences = Array.from(new Set(sequences)).sort((a, b) => a - b)
    expect(distinctSequences).toEqual([1, 2, 3, 4])
  })
})
