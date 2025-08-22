import { expect, test } from '../fixtures/motia-fixtures'

test.describe('Traces tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-closed', 'true')
    })
  })

  test('should execute default flow and see it in traces', async ({ workbench, tracesPage, api }) => {
    let traceId: string

    await test.step('Smoke test', async () => {
      await workbench.open()
      await workbench.navigateToTraces()
      await tracesPage.verifyTracesInterface()
      await expect(tracesPage.traceDetailsContainer).toHaveText('Select a trace or trace group to view the timeline')
    })

    await test.step('Execute default flow', async () => {
      const response = await api.post('/default', {})
      const body = (await response.json()) as Record<string, string>
      traceId = body.traceId
    })

    await test.step('Verify new trace', async () => {
      const card = tracesPage.getTraceCard(traceId)
      await expect(card).toBeVisible()
      await expect(card).toContainText(traceId)
      await expect(card).toContainText('ApiTrigger')

      await card.click()
      await expect(tracesPage.traceDetailsContainer).not.toContainText(
        'Select a trace or trace group to view the timeline',
      )

      await expect(tracesPage.traceDetailsContainer).toContainText('ApiTrigger')
      await expect(tracesPage.traceDetailsContainer).toContainText('SetStateChange')
      await expect(tracesPage.traceDetailsContainer).toContainText('CheckStateChange')
    })
  })
})
