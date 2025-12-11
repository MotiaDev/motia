import { expect, type Locator, type Page } from '@playwright/test'
import { MotiaApplicationPage } from './MotiaApplicationPage'

export class LogsPage extends MotiaApplicationPage {
  readonly logsContainer: Locator
  readonly scrollContainer: Locator
  readonly logEntries: Locator
  readonly clearLogsButton: Locator
  readonly logTableRows: Locator
  readonly logDetailsSidebar: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    super(page)
    this.logsContainer = page.getByTestId('logs-container')
    this.scrollContainer = this.logsContainer.locator('.overflow-auto.h-full')
    this.logTableRows = page.getByTestId('log-row')
    this.logEntries = this.logTableRows
    this.clearLogsButton = page.getByRole('button', { name: /Clear/i })
    this.logDetailsSidebar = page.getByTestId('sidebar-panel')
    this.searchInput = page.getByPlaceholder('Search by Trace ID or Message')
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
    const row = this.page.locator(`[data-testid="log-row"][data-index="${index}"]`)
    await row.waitFor({ timeout })
    await row.scrollIntoViewIfNeeded()
    return row.getByTestId(`msg-${index}`)
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

  async scrollToLogAtIndex(index: number) {
    const row = this.page.locator(`[data-testid="log-row"][data-index="${index}"]`)
    await row.scrollIntoViewIfNeeded()
    return row
  }

  async clickLogAtIndex(index: number) {
    const row = await this.scrollToLogAtIndex(index)
    await row.click()
  }

  async getLogDetailsAtIndex(index: number) {
    const row = await this.scrollToLogAtIndex(index)
    const time = await row.getByTestId(`time-${index}`).textContent()
    const step = await row.getByTestId(`step-${index}`).textContent()
    const message = await row.getByTestId(`msg-${index}`).textContent()

    return { time, step, message }
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

  async getVisibleLogCount() {
    return await this.logTableRows.count()
  }

  async getLogCount() {
    return await this.getVisibleLogCount()
  }

  async getAllLogMessages() {
    const logTexts: string[] = []
    const rows = await this.logTableRows.all()

    for (const row of rows) {
      const index = await row.getAttribute('data-index')
      if (index !== null) {
        const messageCell = row.getByTestId(`msg-${index}`)
        const logText = await messageCell.textContent()
        if (logText) {
          logTexts.push(logText)
        }
      }
    }

    return logTexts
  }

  async verifyStepsExecuted(expectedSteps: string[]) {
    for (const stepName of expectedSteps) {
      await this.waitForLogFromStep(stepName)
    }
  }

  async getTraceIdElement(traceId: string) {
    return this.page.getByTestId(`trace-${traceId}`)
  }

  async getTraceFilterButton(traceId: string) {
    return this.page.getByTestId(`trace-filter-${traceId}`)
  }

  async filterByTraceId(traceId: string) {
    const filterButton = await this.getTraceFilterButton(traceId)
    await filterButton.click()
  }

  async verifyLogDetailsOpen() {
    await expect(this.logDetailsSidebar).toBeVisible()
    await expect(this.logDetailsSidebar).toContainText('Logs Details')
  }

  async verifyLogDetailsClosed() {
    await expect(this.logDetailsSidebar).not.toBeVisible()
  }

  async verifyLogDetailsContainsTraceId(traceId: string) {
    await expect(this.logDetailsSidebar).toContainText(traceId)
  }

  async getSearchValue() {
    return await this.searchInput.inputValue()
  }

  async getFirstLogTraceId() {
    const firstRow = this.page.locator('[data-testid="log-row"][data-index="0"]')
    await firstRow.waitFor({ timeout: 15000 })
    const traceElement = firstRow.locator('[data-testid^="trace-"]:not([data-testid*="filter"])')
    return await traceElement.textContent()
  }

  async clickTraceIdAtIndex(index: number) {
    const row = await this.scrollToLogAtIndex(index)
    const traceElement = row.locator('[data-testid^="trace-"]:not([data-testid*="filter"])')
    await traceElement.click()
  }

  async clickTraceFilterAtIndex(index: number) {
    const row = await this.scrollToLogAtIndex(index)
    const filterButton = row.locator('[data-testid^="trace-filter-"]')
    await filterButton.click()
  }

  async waitForStepExecution(stepName: string, timeout: number = 30000) {
    await this.waitForLogFromStep(stepName, timeout)
  }

  async waitForFlowCompletion(_flowName: string, _timeout: number = 60000) {
    await this.page.waitForTimeout(1000)
    const finalLogCount = await this.getVisibleLogCount()
    expect(finalLogCount).toBeGreaterThan(0)
  }

  async verifyLogStructure() {
    await expect(this.logsContainer).toBeVisible()
    await expect(this.scrollContainer).toBeVisible()
  }

  async waitForLogsToLoad(timeout: number = 10000) {
    await this.logsContainer.waitFor({ timeout })
    await this.scrollContainer.waitFor({ timeout })
  }
}
