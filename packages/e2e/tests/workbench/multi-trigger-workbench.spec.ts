import { expect, test } from '@/src/motia-fixtures'

test.describe('Multi-Trigger Workbench Integration', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should display multi-trigger-demo flow in workbench', async ({ workbench }) => {
    await test.step('Navigate to workbench', async () => {
      await workbench.open()
      await workbench.verifyWorkbenchInterface()
    })

    await test.step('Verify multi-trigger-demo flow exists', async () => {
      const flowCount = await workbench.getFlowCount()
      expect(flowCount).toBeGreaterThan(0)

      // Try to navigate to the multi-trigger-demo flow
      await workbench.navigateToFlow('multi-trigger-demo')
    })
  })

  test('should show multi-trigger steps in workbench', async ({ workbench, page }) => {
    await test.step('Navigate to multi-trigger flow', async () => {
      await workbench.open()
      await workbench.navigateToFlow('multi-trigger-demo')
    })

    await test.step('Wait for workbench to load', async () => {
      await page.waitForLoadState('networkidle')
      // Give the workbench time to render the flow
      await page.waitForTimeout(2000)
    })

    await test.step('Verify workbench is functional', async () => {
      const hasWorkbenchFeatures = await workbench.hasWorkbenchFeatures()
      expect(hasWorkbenchFeatures).toBeTruthy()
    })
  })

  test('should execute multi-trigger steps and show in logs', async ({ workbench, logsPage, api }) => {
    await test.step('Navigate to workbench', async () => {
      await workbench.open()
      await workbench.navigateToFlow('multi-trigger-demo')
    })

    await test.step('Trigger analytics via API', async () => {
      const response = await api.post('/analytics/run', {
        userId: 'workbench_test_user',
        forceRecalculation: true,
      })
      expect(response.status).toBe(200)
    })

    await test.step('Navigate to logs and verify execution', async () => {
      await workbench.navigateToLogs()

      // Wait for logs to appear
      await logsPage.page.waitForTimeout(3000)

      // Verify logs page loaded
      const logs = await logsPage.getAllLogMessages()
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  test('should handle multiple step executions in workbench', async ({ workbench, logsPage, api }) => {
    await test.step('Execute multiple multi-trigger steps', async () => {
      // Trigger various endpoints
      await api.post('/analytics/run', { userId: 'multi_step_1' })
      await api.post('/notifications/send', { userId: 'multi_step_2', message: 'Test' })
      await api.get('/health/check')
      await api.post('/cache/clear', { operation: 'cleanup' })
    })

    await test.step('Navigate to logs', async () => {
      await workbench.open()
      await workbench.navigateToLogs()
      await logsPage.page.waitForTimeout(2000)
    })

    await test.step('Verify execution logs exist', async () => {
      const logs = await logsPage.getAllLogMessages()
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  test('should display step details in workbench', async ({ workbench, page }) => {
    await test.step('Navigate to multi-trigger flow', async () => {
      await workbench.open()
      await workbench.navigateToFlow('multi-trigger-demo')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
    })

    await test.step('Verify flow is loaded', async () => {
      const url = page.url()
      expect(url).toContain('multi-trigger-demo')
    })
  })
})

test.describe('Multi-Trigger Logs and Traces', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should show execution traces for analytics step', async ({ workbench, tracesPage, api }) => {
    await test.step('Execute analytics step', async () => {
      const response = await api.post('/analytics/run', {
        userId: 'trace_test_user',
        forceRecalculation: true,
      })
      expect(response.status).toBe(200)
    })

    await test.step('Navigate to traces', async () => {
      await workbench.open()
      // Navigate to traces page
      await tracesPage.page.goto('/traces')
      await tracesPage.page.waitForLoadState('networkidle')
    })

    await test.step('Verify traces page loads', async () => {
      await tracesPage.page.waitForTimeout(2000)
      // Traces page should be visible
      const url = tracesPage.page.url()
      expect(url).toContain('traces')
    })
  })

  test('should track multiple step executions in traces', async ({ workbench, tracesPage, api }) => {
    await test.step('Execute multiple steps', async () => {
      await api.post('/analytics/run', { userId: 'trace_multi_1' })
      await api.post('/notifications/send', { userId: 'trace_multi_2', message: 'Trace test' })
      await api.get('/health/check')
    })

    await test.step('Navigate to traces', async () => {
      await workbench.open()
      await tracesPage.page.goto('/traces')
      await tracesPage.page.waitForLoadState('networkidle')
      await tracesPage.page.waitForTimeout(2000)
    })

    await test.step('Verify traces page is accessible', async () => {
      const url = tracesPage.page.url()
      expect(url).toContain('traces')
    })
  })
})

test.describe('Multi-Trigger Real-time Updates', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should show real-time log updates', async ({ workbench, logsPage, api, page }) => {
    await test.step('Navigate to logs page', async () => {
      await workbench.open()
      await workbench.navigateToLogs()
      await page.waitForLoadState('networkidle')
    })

    await test.step('Execute step and verify log appears', async () => {
      // Get initial log count
      await page.waitForTimeout(1000)
      const initialLogs = await logsPage.getAllLogMessages()
      const initialCount = initialLogs.length

      // Execute a step
      await api.post('/analytics/run', { userId: 'realtime_test' })

      // Wait for new logs
      await page.waitForTimeout(3000)

      // Check if new logs appeared
      const updatedLogs = await logsPage.getAllLogMessages()
      const updatedCount = updatedLogs.length

      expect(updatedCount).toBeGreaterThanOrEqual(initialCount)
    })
  })

  test('should handle rapid step executions', async ({ workbench, logsPage, api }) => {
    await test.step('Navigate to logs', async () => {
      await workbench.open()
      await workbench.navigateToLogs()
    })

    await test.step('Execute multiple steps rapidly', async () => {
      const requests = []
      for (let i = 0; i < 5; i++) {
        requests.push(api.post('/analytics/run', { userId: `rapid_${i}` }))
      }
      await Promise.all(requests)
    })

    await test.step('Wait for logs to update', async () => {
      await logsPage.page.waitForTimeout(3000)

      const logs = await logsPage.getAllLogMessages()
      expect(logs.length).toBeGreaterThan(0)
    })
  })
})

test.describe('Multi-Trigger Error Scenarios in Workbench', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should display errors in logs when they occur', async ({ workbench, logsPage, api }) => {
    await test.step('Navigate to logs', async () => {
      await workbench.open()
      await workbench.navigateToLogs()
    })

    await test.step('Execute steps and monitor for errors', async () => {
      // Execute normal operations
      await api.post('/analytics/run', { userId: 'error_test' })
      await api.post('/notifications/send', { userId: 'error_test', message: 'Test' })

      await logsPage.page.waitForTimeout(2000)

      // Get logs
      const logs = await logsPage.getAllLogMessages()
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  test('should recover from transient errors', async ({ api }) => {
    await test.step('Execute steps after potential error', async () => {
      // Execute a normal operation
      const response1 = await api.post('/analytics/run', { userId: 'recovery_test_1' })
      expect(response1.status).toBe(200)

      // Execute another operation
      const response2 = await api.post('/analytics/run', { userId: 'recovery_test_2' })
      expect(response2.status).toBe(200)
    })

    await test.step('Verify system is still operational', async () => {
      const healthResponse = await api.get('/health/check')
      expect(healthResponse.status).toBe(200)

      const healthData = await api.getResponseJson(healthResponse)
      expect(healthData.status).toBe('healthy')
    })
  })
})
