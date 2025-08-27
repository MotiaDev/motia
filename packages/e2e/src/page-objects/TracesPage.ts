import { expect, type Locator, type Page } from '@playwright/test'
import { MotiaApplicationPage } from './MotiaApplicationPage'

export class TracesPage extends MotiaApplicationPage {
  readonly sidebarContainer: Locator
  readonly tracesContainer: Locator
  readonly traceDetailsContainer: Locator

  constructor(page: Page) {
    super(page)
    this.sidebarContainer = page.getByTestId('sidebar')
    this.tracesContainer = page.getByTestId('traces-container')
    this.traceDetailsContainer = page.getByTestId('trace-details')
  }

  async verifyTracesInterface() {
    await expect(this.tracesContainer).toBeVisible()
  }

  getTraceCard(traceId: string) {
    return this.tracesContainer.getByTestId(`trace-${traceId}`)
  }
}
