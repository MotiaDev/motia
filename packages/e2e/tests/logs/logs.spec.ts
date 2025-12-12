import { expect, test } from '@/src/motia-fixtures'

test.describe('Logs Page Tests', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should open log details when clicking trace ID', async ({ workbench, logsPage, api }) => {
    let clickedTraceId: string

    await test.step('Navigate to logs and trigger a flow', async () => {
      await workbench.open()

      // Trigger a flow to generate logs
      await workbench.executeTutorialFlow(api)

      await workbench.navigateToLogs()
      await logsPage.waitForLogsToLoad()
    })

    await test.step('Wait for logs to appear', async () => {
      await logsPage.waitForLogFromStep('ApiTrigger')
    })

    await test.step('Click on trace ID should open log details', async () => {
      // Get the trace ID from the first log row before clicking
      const traceId = await logsPage.getFirstLogTraceId()
      expect(traceId).not.toBeNull()
      clickedTraceId = traceId!

      // Click on the trace ID text (not the filter button)
      await logsPage.clickTraceIdAtIndex(0)

      // Verify the log details sidebar opens
      await logsPage.verifyLogDetailsOpen()

      // Verify the trace ID from the clicked row is shown in the details
      await logsPage.verifyLogDetailsContainsTraceId(clickedTraceId)
    })

    await test.step('Verify search is NOT populated (trace ID click should not filter)', async () => {
      const searchValue = await logsPage.getSearchValue()
      expect(searchValue).toBe('')
    })
  })

  test('should filter logs when clicking trace filter button', async ({ workbench, logsPage, api }) => {
    let expectedTraceId: string

    await test.step('Navigate to logs and trigger a flow', async () => {
      await workbench.open()

      // Trigger a flow to generate logs
      await workbench.executeTutorialFlow(api)

      await workbench.navigateToLogs()
      await logsPage.waitForLogsToLoad()
    })

    await test.step('Wait for logs to appear', async () => {
      await logsPage.waitForLogFromStep('ApiTrigger')
    })

    await test.step('Get the trace ID we will filter by', async () => {
      const traceId = await logsPage.getFirstLogTraceId()
      expect(traceId).not.toBeNull()
      expectedTraceId = traceId!
    })

    await test.step('Click filter button should filter logs by trace ID', async () => {
      // Click on the filter button (not the trace ID text)
      await logsPage.filterByTraceId(expectedTraceId)

      // Verify the search input is populated with the trace ID
      const searchValue = await logsPage.getSearchValue()
      expect(searchValue).toBe(expectedTraceId)
    })

    await test.step('Verify log details sidebar is NOT open after filtering', async () => {
      await logsPage.verifyLogDetailsClosed()
    })
  })

  test('should open details when clicking row vs filter when clicking filter button', async ({
    workbench,
    logsPage,
    api,
  }) => {
    await test.step('Setup: Navigate and generate logs', async () => {
      await workbench.open()
      await workbench.executeTutorialFlow(api)
      await workbench.navigateToLogs()
      await logsPage.waitForLogsToLoad()
      await logsPage.waitForLogFromStep('ApiTrigger')
    })

    await test.step('Click on log row should open details', async () => {
      await logsPage.clickLogAtIndex(0)
      await logsPage.verifyLogDetailsOpen()

      // Search should remain empty
      const searchValue = await logsPage.getSearchValue()
      expect(searchValue).toBe('')
    })
  })
})
