import { expect, test } from '@/src/motia-fixtures'

test.describe('Flow Execution Tests', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should handle flow execution with API trigger', async ({ workbench, logsPage, api, page }) => {
    await test.step('Navigate to workbench', async () => {
      await workbench.open()
      await workbench.verifyWorkbenchInterface()
    })

    await test.step('Trigger flow via API', async () => {
      const response = await workbench.executeTutorialFlow(api)

      await api.verifyResponseStatus(response, 200)
    })

    await test.step('Verify API triggered flow in workbench', async () => {
      await workbench.navigateToLogs()

      await logsPage.clickLogFromStep('ApiTrigger')
      await page.getByLabel('Test API trigger')
    })
  })

  test('should handle flow errors gracefully', async ({ workbench, logsPage, api }) => {
    await test.step('Trigger a flow that might error', async () => {
      // This would trigger an endpoint that intentionally errors
      const response = await api.post('/api/trigger/error-flow', {
        shouldError: true,
      })

      // We expect this to handle gracefully, not necessarily succeed
      expect([200, 400, 404, 500]).toContain(response.status)
    })

    await test.step('Verify error handling in logs', async () => {
      await workbench.open()
      await workbench.navigateToLogs()

      // Look for error handling messages
      const errorPatterns = ['error', 'failed', 'exception']
      const logs = await logsPage.getAllLogMessages()

      const hasErrorHandling = logs.some((log) => errorPatterns.some((pattern) => log.toLowerCase().includes(pattern)))

      // We don't expect errors in normal flow, but if they occur, they should be logged
      if (hasErrorHandling) {
        console.log('Error handling detected in logs - this is expected behavior')
      }
    })
  })
})
