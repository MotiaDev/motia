import {
  createBullMQTestCaseId,
  emitBullMQEvent,
  resetBullMQTestCase,
  waitForBullMQResults,
} from '@/src/bullmq-test-utils'
import { expect, test } from '@/src/motia-fixtures'

const STANDARD_QUEUE = 'bullmq.tests.standard.BullMQStandardPrimary'

test.describe('BullMQ Workbench UI', () => {
  test.beforeEach(async ({ helpers }) => helpers.skipTutorial())

  test.skip('shows queue list, details, and job interactions', async ({ api, bullmq }) => {
    const testCaseId = createBullMQTestCaseId()
    await resetBullMQTestCase(api, testCaseId)
    await emitBullMQEvent(api, {
      topic: 'bullmq.tests.standard',
      testCaseId,
      payload: { uiCheck: true },
    })
    await waitForBullMQResults(api, testCaseId, (items) => items.length >= 2)

    await bullmq.openQueuesTab()
    await bullmq.searchQueue('standard')
    await bullmq.selectQueue(STANDARD_QUEUE)

    await expect(bullmq.page.getByRole('heading', { name: STANDARD_QUEUE })).toBeVisible()
    await bullmq.resetSearch()

    await bullmq.pauseQueue()
    if (await bullmq.page.getByText('Paused').isVisible()) {
      await expect(bullmq.page.getByText('Paused')).toBeVisible()
      await bullmq.resumeQueue()
      await expect(bullmq.page.getByText('Paused')).not.toBeVisible()
    }

    await bullmq.selectStatusTab('Completed')
    const jobRows = await bullmq.getJobRows()
    await expect(jobRows.first()).toBeVisible()
  })
})
