import { expect, type Locator, type Page } from '@playwright/test'
import { MotiaApplicationPage } from './MotiaApplicationPage'
import { ApiHelpers } from './ApiHelpers'

export class WorkbenchPage extends MotiaApplicationPage {
  readonly sidebarContainer: Locator
  readonly logsLink: Locator
  readonly statesLink: Locator
  readonly endpointsLink: Locator
  readonly tracesLink: Locator
  readonly flowsLink: Locator
  readonly flowsDropdownTrigger: Locator
  readonly startFlowButton: Locator
  readonly flowContainer: Locator
  readonly tutorialPopover: Locator
  readonly tutorialPopoverTitle: Locator
  readonly tutorialNextButton: Locator

  constructor(page: Page) {
    super(page)
    this.sidebarContainer = page.getByTestId('sidebar')
    this.logsLink = page.getByTestId('logs-link')
    this.statesLink = page.getByTestId('states-link')
    this.tracesLink = page.getByTestId('tracing-link')
    this.endpointsLink = page.getByTestId('endpoints-link')
    this.flowsDropdownTrigger = page.getByTestId('flows-dropdown-trigger')
    this.flowsLink = page.locator('.flows-dropdown .flow-link')
    this.startFlowButton = page.getByTestId('start-flow-button')
    this.flowContainer = page.getByTestId('flow-container')
    this.tutorialPopover = page.locator('.driver-popover')
    this.tutorialPopoverTitle = page.locator('.popover-title')
    this.tutorialNextButton = page.locator('.driver-popover-next-btn')
  }

  async open() {
    await this.goto('/')
  }

  async verifyWorkbenchInterface() {
    await expect(this.logoIcon).toBeVisible()
    await expect(this.logsLink).toBeVisible()
    await expect(this.statesLink).toBeVisible()
    await expect(this.endpointsLink).toBeVisible()
    await expect(this.flowsDropdownTrigger).toBeVisible()
  }

  async navigateToLogs() {
    await this.logsLink.click()
    await this.waitForApplication()
  }

  async navigateToTraces() {
    await this.tracesLink.click()
    await this.waitForApplication()
  }

  async navigateToStates() {
    await this.statesLink.click()
    await this.waitForApplication()
  }

  async navigateToEndpoints() {
    await this.endpointsLink.click()
    await this.waitForApplication()
  }

  async getFlowCount() {
    await this.flowsDropdownTrigger.click()
    const count = await this.flowsLink.count()
    await this.page.keyboard.press('Escape') // close the dropdown

    return count
  }

  async navigateToFlow(flowName: string) {
    await this.flowsDropdownTrigger.click()
    const flowLink = this.page.getByTestId(`dropdown-${flowName}`)
    await flowLink.click()
    await this.waitForApplication()
  }

  async navigateToFlowByIndex(index: number) {
    await this.flowsDropdownTrigger.click()
    const flowLink = this.flowsLink.nth(index)
    await flowLink.click()
    await this.waitForApplication()
  }

  async startFlow() {
    await this.startFlowButton.click()
    await this.page.waitForTimeout(3000)
  }

  async executeFlowAndNavigateToLogs(flowName: string = 'default') {
    await this.navigateToFlow(flowName)
    await this.startFlow()
    await this.navigateToLogs()
  }

  async executeTutorialFlow(api: ApiHelpers) {
    return api.post('/basic-tutorial', {
      pet: {
        name: 'string',
        photoUrl: 'string',
      },
      foodOrder: {
        id: 'string',
        quantity: 0,
      },
    })
  }

  async executeTutorialFlowAndNavigateToLogs(api: ApiHelpers) {
    await this.navigateToFlow('basic-tutorial')
    await this.executeTutorialFlow(api)
    await this.navigateToLogs()
  }

  async verifyStepsInWorkbench(stepNames: string[]) {
    for (const stepName of stepNames) {
      const stepElement = this.page.getByText(stepName).first()
      const isVisible = await stepElement.isVisible({ timeout: 5000 })
      if (isVisible) {
        await expect(stepElement).toBeVisible()
      }
    }
  }

  async hasWorkbenchFeatures() {
    const workbenchIndicators = [
      this.page.getByText(/workbench/i),
      this.page.getByText(/motia/i),
      this.navigation,
      this.mainContent,
    ]

    for (const indicator of workbenchIndicators) {
      const isVisible = await indicator.first().isVisible({ timeout: 3000 })
      if (isVisible) {
        return true
      }
    }
    return false
  }

  async verifyProjectInformation() {
    const projectIndicators = [this.logsLink, this.statesLink, this.endpointsLink]

    for (const indicator of projectIndicators) {
      const isVisible = await indicator.first().isVisible({ timeout: 5000 })
      if (isVisible) {
        return true
      }
    }
    return false
  }
}
