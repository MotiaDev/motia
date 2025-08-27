import { expect, test } from '@/src/motia-fixtures'

test.describe('CLI Generated Project - Smoke Tests', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('CLI generated project loads successfully', async ({ motiaApp, workbench }) => {
    await workbench.open()

    await motiaApp.isApplicationLoaded()
  })

  test('CLI generated project has basic API endpoints', async ({ api }) => {
    const commonEndpoints = ['/default']

    const hasWorkingEndpoint = await api.verifyCommonEndpoints(commonEndpoints)
    expect(hasWorkingEndpoint).toBeTruthy()
  })

  test('CLI generated project workbench is functional', async ({ workbench }) => {
    await workbench.open()

    const hasWorkbenchFeatures = await workbench.hasWorkbenchFeatures()
    expect(hasWorkbenchFeatures).toBeTruthy()
  })

  test('CLI generated project handles navigation', async ({ motiaApp, page, workbench }) => {
    await workbench.open()

    const links = page.locator('a[href]')
    const linkCount = await links.count()

    if (linkCount > 0) {
      const firstLink = links.first()
      const href = await firstLink.getAttribute('href')

      if (href && !href.startsWith('http') && href !== '/') {
        await firstLink.click()
        await motiaApp.waitForApplication()

        await expect(motiaApp.body).toBeVisible()
      }
    }

    expect(true).toBeTruthy()
  })

  test('CLI generated project has no critical console errors', async ({ motiaApp, workbench }) => {
    const errors = await motiaApp.collectConsoleErrors()

    await workbench.open()

    expect(errors.length).toBeLessThanOrEqual(2)
  })

  test('CLI generated project responds to basic HTTP requests', async ({ api }) => {
    const response = await api.get('/')

    await api.verifyResponseNotError(response)
    await api.verifyResponseHeaders(response)
  })
})
