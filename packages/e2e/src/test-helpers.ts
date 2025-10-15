import { expect, type Page } from '@playwright/test'

export class TestHelpers {
  constructor(private page: Page) {}

  async skipTutorial() {
    await this.page.addInitScript(() => localStorage.setItem('motia-tutorial-closed', 'true'))
  }

  async waitForMotiaApplication() {
    await this.page.waitForLoadState('networkidle')
    await expect(this.page.locator('body')).toBeVisible()
  }

  async navigateToWorkbench() {
    await this.page.goto('/flow/default')
    await this.waitForMotiaApplication()
  }

  async navigateToDocs() {
    await this.page.goto('/docs')
    await this.waitForMotiaApplication()
  }

  async createApiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    return await this.page.request.fetch(endpoint, options)
  }

  async waitForStepExecution(stepName: string, timeout: number = 30000) {
    await this.page.waitForSelector(`[data-testid="step-${stepName}"][data-status="completed"]`, { timeout })
  }

  async waitForFlowCompletion(flowName: string, timeout: number = 60000) {
    await this.page.waitForSelector(`[data-testid="flow-${flowName}"][data-status="completed"]`, { timeout })
  }

  async takeScreenshotOnFailure(testName: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${testName}-failure.png`,
      fullPage: true,
    })
  }

  async getLogs() {
    return await this.page.evaluate(() => {
      return (globalThis as any).motiaLogs || []
    })
  }

  async clearLogs() {
    await this.page.evaluate(() => {
      ;(globalThis as any).motiaLogs = []
    })
  }

  async waitForLogEntry(logText: string, timeout: number = 15000) {
    const logElement = this.page.locator(`text=${logText}`).first()
    await logElement.waitFor({ timeout })
    return logElement
  }

  async waitForMultipleLogEntries(logTexts: string[], timeout: number = 15000) {
    const results = []
    for (const logText of logTexts) {
      const logElement = await this.waitForLogEntry(logText, timeout)
      results.push(logElement)
    }
    return results
  }

  async executeFlowAndWaitForCompletion(flowName: string = 'default') {
    // Navigate to flow
    const flowLink = this.page.getByTestId(`flow-${flowName}-link`)
    await flowLink.click()
    await this.page.waitForLoadState('networkidle')

    // Click start flow button
    const startButton = this.page.getByTestId('start-flow-button')
    await startButton.click()

    // Wait for execution
    await this.page.waitForTimeout(3000)

    // Navigate to logs
    const logsLink = this.page.getByTestId('logs-link')
    await logsLink.click()
    await this.page.waitForLoadState('networkidle')
  }
}
