import { expect, test } from '@playwright/test'
import { WorkbenchPage } from '@/src/page-objects'

test.use({ viewport: { width: 1920, height: 1080 } })

test.describe('Motia Basic Tutorial - Workbench', () => {
  let workbench: WorkbenchPage

  test.beforeEach(async ({ page }) => {
    workbench = new WorkbenchPage(page)

    await page.addInitScript(() => {
      localStorage.removeItem('motia-tutorial-skipped')
      let currentFlowStorage: {
        state?: {
          selectedFlowId?: string
        }
      } = {}

      try {
        currentFlowStorage = JSON.parse(localStorage.getItem('motia-flow-storage') ?? '{}')
      } catch {
        console.error('Failed to parse motia-flow-storage')
      }

      localStorage.setItem(
        'motia-flow-storage',
        JSON.stringify({
          ...currentFlowStorage,
          state: {
            ...(currentFlowStorage?.state ?? {}),
            selectedFlowId: 'basic-tutorial',
          },
        }),
      )
    })
  })

  test('should load workbench page with the basic tutorial present', async () => {
    await workbench.open()

    await expect(workbench.body).toBeVisible()
    await expect(workbench.logoIcon.first()).toBeVisible()
    await expect(workbench.tutorialPopover).toBeVisible()
  })

  test('tutorial navigation keys should navigate forward', async ({ page }) => {
    await workbench.open()

    await expect(workbench.tutorialPopover).toBeVisible()

    const initialTitle = await workbench.tutorialPopoverTitle.innerText()

    await workbench.tutorialNextButton.click()
    await page.waitForTimeout(500)

    const finalTitle = await workbench.tutorialPopoverTitle.innerText()
    await expect(finalTitle).not.toEqual(initialTitle)

    const currentTitle = await workbench.tutorialPopoverTitle.innerText()
    await expect(currentTitle).not.toEqual(initialTitle)
  })

  test('tutorial can dynamically open the code preview', async ({ page }) => {
    await workbench.open()

    await expect(workbench.tutorialPopover).toBeVisible()

    for (let i = 0; i < 3; i++) {
      await workbench.tutorialNextButton.click()
      await page.waitForTimeout(500)
    }

    await expect(page.locator('#app-sidebar-container').first()).toBeVisible()
  })

  test('tutorial should not appear after skipping it', async ({ page }) => {
    await workbench.open()

    await expect(workbench.tutorialPopover).toBeVisible()

    const tutorialOptOutButton = page.locator('.tutorial-opt-out-button').first()
    await expect(tutorialOptOutButton).toBeVisible()

    await tutorialOptOutButton.click()

    await expect(workbench.tutorialPopover).not.toBeVisible()
  })

  test('tutorial button shoud override the skip tutorial setting', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('motia-tutorial-closed', 'true')
    })

    await workbench.open()

    await expect(workbench.tutorialPopover).not.toBeVisible()
    const tutorialButton = page.getByTestId('tutorial-trigger').first()
    await expect(tutorialButton).toBeVisible()
    await tutorialButton.click()
    await expect(workbench.tutorialPopover).toBeVisible()
  })
})
