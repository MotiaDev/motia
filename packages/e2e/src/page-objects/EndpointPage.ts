import { expect, type Locator, type Page } from '@playwright/test'
import { MotiaApplicationPage } from './MotiaApplicationPage'

export class EndpointPage extends MotiaApplicationPage {
  readonly firstEndpointItem: Locator
  readonly firstEndpointFlowGroup: Locator
  readonly editor: Locator
  readonly playButton: Locator
  readonly responseContainer: Locator

  constructor(page: Page) {
    super(page)
    this.firstEndpointItem = page.getByTestId('endpoint-POST-/basic-tutorial')
    this.firstEndpointFlowGroup = page.getByTestId('flow-group-basic-tutorial')
    this.editor = page.locator('.monaco-editor')
    this.playButton = page.getByTestId('endpoint-play-button')
    this.responseContainer = page.getByTestId('endpoint-response-container')
  }

  async setValueInBodyEditor(value: string) {
    await this.page.waitForTimeout(2000)
    await expect(this.editor).toBeVisible()
    await this.page.evaluate((value) => {
      // @ts-ignore monaco should be present
      window.monaco.editor.getEditors()[0].setValue(value)
    }, value)
  }

  async getBodyEditorValue() {
    await this.page.waitForTimeout(2000)
    await expect(this.editor).toBeVisible()
    return await this.page.evaluate(() => {
      // @ts-ignore monaco should be present
      return window.monaco.editor.getEditors()[0].getValue()
    })
  }
}
