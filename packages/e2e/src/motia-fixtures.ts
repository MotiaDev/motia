import { test as base } from '@playwright/test'
import { ApiHelpers, EndpointPage, LogsPage, MotiaApplicationPage, TracesPage, WorkbenchPage } from './page-objects'
import { TestHelpers } from './test-helpers'

export type MotiaContext = {
  motiaApp: MotiaApplicationPage
  workbench: WorkbenchPage
  endpoint: EndpointPage
  logsPage: LogsPage
  tracesPage: TracesPage
  api: ApiHelpers
  helpers: TestHelpers
}

export const test = base.extend<MotiaContext>({
  helpers: async ({ page }, use) => {
    const helpers = new TestHelpers(page)
    await use(helpers)
  },

  motiaApp: async ({ page }, use) => {
    const motiaApp = new MotiaApplicationPage(page)
    await use(motiaApp)
  },

  workbench: async ({ page }, use) => {
    const workbench = new WorkbenchPage(page)
    await use(workbench)
  },

  endpoint: async ({ page }, use) => {
    const endpoint = new EndpointPage(page)
    await use(endpoint)
  },

  logsPage: async ({ page }, use) => {
    const logsPage = new LogsPage(page)
    await use(logsPage)
  },

  tracesPage: async ({ page }, use) => {
    const tracesPage = new TracesPage(page)
    await use(tracesPage)
  },

  api: async ({ page }, use) => {
    const api = new ApiHelpers(page)
    await use(api)
  },
})

export { expect } from '@playwright/test'
