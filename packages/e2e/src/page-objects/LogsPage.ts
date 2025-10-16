import { expect, type Locator, type Page } from '@playwright/test'
import { MotiaApplicationPage } from './MotiaApplicationPage'

export class LogsPage extends MotiaApplicationPage {
  readonly logsContainer: Locator
  readonly logEntries: Locator
  readonly clearLogsButton: Locator
  readonly logsTable: Locator
  readonly logTableRows: Locator

  constructor(page: Page) {
    super(page)
    this.logsContainer = page.locator('.overflow-y-auto.h-full.text-bold.p-4')
    this.logsTable = page.locator('table')
    this.logTableRows = page.locator('tbody tr')
    this.logEntries = this.logTableRows
    this.clearLogsButton = page.getByRole('button', { name: 'Clear logs' })
  }

  async waitForLogContainingText(logText: string, timeout: number = 15000) {
    const logElement = this.page
      .getByTestId(/msg-\d+/)
      .filter({ hasText: logText })
      .first()
    await logElement.waitFor({ timeout })
    return logElement
  }

  async waitForLogFromStep(stepName: string, timeout: number = 15000) {
    const logElement = this.page
      .getByTestId(/step-\d+/)
      .filter({ hasText: stepName })
      .first()
    await logElement.waitFor({ timeout })
    return logElement
  }

  async clickLogFromStep(stepName: string) {
    const logElement = this.page
      .getByTestId(/step-\d+/)
      .filter({ hasText: stepName })
      .first()
    await logElement.waitFor({ timeout: 15000 })
    await expect(logElement).toBeVisible()
    await logElement.click()
  }

  async waitForLogAtIndex(index: number, timeout: number = 15000) {
    const logElement = this.page.getByTestId(`msg-${index}`)
    await logElement.waitFor({ timeout })
    return logElement
  }

  async waitForLogsContainingTexts(logTexts: string[], timeout: number = 15000) {
    const results = []
    for (const logText of logTexts) {
      const logElement = await this.waitForLogContainingText(logText, timeout)
      results.push(logElement)
    }
    return results
  }

  async verifyLogContainingText(logText: string) {
    const logElement = await this.waitForLogContainingText(logText)
    await expect(logElement).toBeVisible()
  }

  async verifyLogsContainingTexts(logTexts: string[]) {
    for (const logText of logTexts) {
      await this.verifyLogContainingText(logText)
    }
  }

  async clickLogAtIndex(index: number) {
    await this.logTableRows.nth(index).click()
  }

  async getLogDetailsAtIndex(index: number) {
    const row = this.logTableRows.nth(index)
    const time = await row.getByTestId(`time-${index}`).textContent()
    const traceId = await row.getByTestId(`trace-${index}`).textContent()
    const step = await row.getByTestId(`step-${index}`).textContent()
    const message = await row.getByTestId(`msg-${index}`).textContent()

    return { time, traceId, step, message }
  }

  async getAllLogDetails() {
    const count = await this.getLogCount()
    const logs = []

    for (let i = 0; i < count; i++) {
      const log = await this.getLogDetailsAtIndex(i)
      logs.push(log)
    }

    return logs
  }

  async clearAllLogs() {
    if (await this.clearLogsButton.isVisible()) {
      await this.clearLogsButton.click()
    }
  }

  async getLogCount() {
    return await this.logTableRows.count()
  }

  async getAllLogMessages() {
    const count = await this.getLogCount()
    const logTexts = []

    for (let i = 0; i < count; i++) {
      const messageCell = this.logTableRows.nth(i).getByTestId(`msg-${i}`)
      const logText = await messageCell.textContent()
      if (logText) {
        logTexts.push(logText)
      }
    }

    return logTexts
  }

  async verifyStepsExecuted(expectedSteps: string[]) {
    for (const stepName of expectedSteps) {
      await this.waitForLogFromStep(stepName)
    }
  }

  async waitForStepExecution(stepName: string, timeout: number = 30000) {
    await this.waitForLogFromStep(stepName, timeout)
  }

  async waitForFlowCompletion(flowName: string, timeout: number = 60000) {
    await this.page.waitForTimeout(1000)
    const finalLogCount = await this.getLogCount()
    expect(finalLogCount).toBeGreaterThan(0)
  }

  async verifyLogStructure() {
    await expect(this.logsTable).toBeVisible()
    await expect(this.logsContainer).toBeVisible()
  }

  async waitForLogsToLoad(timeout: number = 10000) {
    await this.logsContainer.waitFor({ timeout })
    await this.logsTable.waitFor({ timeout })
  }
}
