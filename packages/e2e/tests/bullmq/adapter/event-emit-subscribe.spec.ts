import {
  createBullMQTestCaseId,
  emitBullMQEvent,
  resetBullMQTestCase,
  waitForBullMQResults,
} from '@/src/bullmq-test-utils'
import { expect, test } from '@/src/motia-fixtures'

test.describe('BullMQ Adapter - Event Delivery', () => {
  test.beforeEach(async ({ helpers }) => helpers.skipTutorial())

  test('delivers events to all subscribers with preserved payload', async ({ api }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)

    const payload = { orderId: testCaseId, amount: 42 }
    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.standard',
      testCaseId,
      payload,
    })

    const results = await waitForBullMQResults(api, testCaseId, (items) => items.length >= 2)
    const subscribers = results.map((result) => result.subscriber).sort()
    expect(subscribers).toEqual(['primary', 'secondary'])

    const payloads = results.map((result) => result.payload)
    payloads.forEach((entry) => {
      expect(entry).toMatchObject(payload)
    })
  })
})
