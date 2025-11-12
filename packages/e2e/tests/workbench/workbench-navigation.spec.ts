import { expect, test } from '@/src/motia-fixtures'

test.use({ viewport: { width: 1920, height: 1080 } })

test.describe('CLI Generated Project - Workbench Navigation', () => {
  test.beforeEach(({ helpers }) => helpers.skipTutorial())

  test('should load workbench page of CLI generated project', async ({ workbench }) => {
    await workbench.open()

    await expect(workbench.body).toBeVisible()
    await expect(workbench.logoIcon.first()).toBeVisible()
  })

  test('should display workbench interface elements', async ({ workbench }) => {
    await workbench.open()

    await workbench.verifyWorkbenchInterface()
  })

  test('should show created steps in the workbench', async ({ workbench }) => {
    await workbench.open()

    const expectedSteps = ['basic-tutorial']
    await workbench.verifyStepsInWorkbench(expectedSteps)
  })

  test('should navigate through workbench sections', async ({ workbench }) => {
    await workbench.open()

    await test.step('Navigate to Logs section', async () => {
      await workbench.navigateToLogs()
      await expect(workbench.body).toBeVisible()
    })

    await test.step('Navigate to States section', async () => {
      await workbench.navigateToStates()
      await expect(workbench.body).toBeVisible()
    })

    await test.step('Navigate to Endpoints section', async () => {
      await workbench.navigateToEndpoints()
      await expect(workbench.body).toBeVisible()
    })
  })

  test('should display project information correctly', async ({ workbench }) => {
    await workbench.open()

    const hasProjectInfo = await workbench.verifyProjectInformation()
    expect(hasProjectInfo).toBeTruthy()
  })

  test('should handle CLI project structure validation', async ({ workbench }) => {
    await workbench.open()

    const healthEndpoint = workbench.page.getByText(/health|status/)
    const stepsSection = workbench.page.getByText(/steps|workflows/)

    const hasHealthInfo = await healthEndpoint.first().isVisible({ timeout: 3000 })
    const hasStepsInfo = await stepsSection.first().isVisible({ timeout: 3000 })

    expect(hasHealthInfo || hasStepsInfo).toBeTruthy()
  })

  test('should execute basic tutorial flow and verify logs', async ({ workbench, logsPage, api }) => {
    await workbench.open()

    await test.step('Execute basic tutorial flow', async () => {
      await workbench.executeTutorialFlowAndNavigateToLogs(api)
    })

    const stepsExecuted = ['ApiTrigger']

    await test.step('Verify all expected logs are present', async () => {
      await logsPage.verifyStepsExecuted(stepsExecuted)
      console.log('✓ Found all expected logs')
    })

    console.log('✅ Successfully executed basic tutorial flow and verified all expected logs')
  })
})
