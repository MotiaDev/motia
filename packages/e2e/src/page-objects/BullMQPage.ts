import { expect, type Locator, type Page } from '@playwright/test'
import { WorkbenchPage } from './WorkbenchPage'

export class BullMQPage extends WorkbenchPage {
  readonly queuesNavLink: Locator
  readonly searchInput: Locator
  readonly jobTable: Locator

  constructor(page: Page) {
    super(page)
    this.queuesNavLink = page.getByRole('link', { name: /queues/i })
    this.searchInput = page.getByPlaceholder('Search queues...')
    this.jobTable = page.locator('table')
  }

  async openQueuesTab() {
    await this.open()
    const linkCandidates = [
      this.page.getByRole('tab', { name: /queues/i }).first(),
      this.page.getByRole('button', { name: /queues/i }).first(),
      this.queuesNavLink.first(),
      this.sidebarContainer.getByText('Queues', { exact: false }).first(),
      this.page.locator('[data-testid="bullmq-queues-link"]').first(),
      this.page.locator('a:has-text("Queues")').first(),
      this.page.locator('button:has-text("Queues")').first(),
    ]

    let clicked = false
    for (const candidate of linkCandidates) {
      try {
        await expect(candidate).toBeVisible({ timeout: 5000 })
        await candidate.click()
        clicked = true
        break
      } catch {}
    }

    if (!clicked) {
      throw new Error('Could not locate BullMQ Queues navigation link')
    }

    await expect(this.searchInput).toBeVisible()
  }

  async searchQueue(name: string) {
    await this.searchInput.fill(name)
  }

  async resetSearch() {
    await this.searchInput.fill('')
  }

  async selectQueue(name: string) {
    const queueButton = this.page.locator('button', { hasText: name }).first()
    await queueButton.waitFor({ state: 'visible' })
    await queueButton.click()
    await expect(this.page.locator('h2', { hasText: name })).toBeVisible()
  }

  async pauseQueue() {
    const pauseButton = this.page.getByRole('button', { name: /Pause/ })
    if (await pauseButton.isVisible()) {
      await pauseButton.click()
    }
  }

  async resumeQueue() {
    const resumeButton = this.page.getByRole('button', { name: /Resume/ })
    if (await resumeButton.isVisible()) {
      await resumeButton.click()
    }
  }

  async selectStatusTab(label: string) {
    const tab = this.page.getByRole('tab', { name: label })
    await tab.click()
  }

  async getJobRows() {
    const rows = this.jobTable.locator('tbody tr')
    return rows
  }
}
