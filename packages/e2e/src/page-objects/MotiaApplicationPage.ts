import { expect, type Locator, type Page } from '@playwright/test'

export class MotiaApplicationPage {
  readonly page: Page
  readonly body: Locator
  readonly title: Locator
  readonly navigation: Locator
  readonly mainContent: Locator
  readonly logoIcon: Locator

  constructor(page: Page) {
    this.page = page
    this.body = page.locator('body')
    this.title = page.getByTestId('motia-title')
    this.navigation = page.locator('nav')
    this.mainContent = page.locator('main')
    this.logoIcon = page.getByTestId('logo-icon')
  }

  async goto(path: string = '/') {
    await this.page.goto(path)
    await this.waitForApplication()
  }

  async waitForApplication() {
    await this.page.waitForLoadState('networkidle')
    await expect(this.body).toBeVisible()
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    })
  }

  async getPageContent() {
    return await this.page.content()
  }

  async hasTitle() {
    await expect(this.page).toHaveTitle(/.*/)
  }

  async isApplicationLoaded() {
    await expect(this.body).toBeVisible()
    const content = await this.getPageContent()
    expect(content.length).toBeGreaterThan(100)
  }

  async collectConsoleErrors() {
    const errors: string[] = []

    this.page.on('pageerror', (error) => {
      if (!error.message.includes('favicon.ico')) {
        errors.push(error.message)
      }
    })

    this.page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
        errors.push(msg.text())
      }
    })

    return errors
  }
}
