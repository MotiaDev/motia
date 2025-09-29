import { expect, test } from '@/src/motia-fixtures'

test.describe('Workbench - Endpoint Call JSON Validation', () => {
  const validJson = `{
        "pet": {
          "name": "string",
          "photoUrl": "string"
        },
        "foodOrder": {
          "id": "string",
          "quantity": 0
        }
      }`
  test.beforeEach(async ({ helpers, workbench, endpoint }) => {
    await helpers.skipTutorial()
    await workbench.open()
    await workbench.navigateToEndpoints()
    await endpoint.firstEndpointFlowGroup.click()
    await endpoint.firstEndpointItem.click()
  })

  test('should validate JSON body input', async ({ endpoint }) => {
    await test.step('Initial state: Play button should be enabled with default/valid JSON', async () => {
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Enter invalid JSON', async () => {
      await endpoint.setValueInBodyEditor('{"invalid_json": "test",')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Enter valid JSON after invalid', async () => {
      await endpoint.setValueInBodyEditor(validJson)
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Enter invalid JSON again to ensure re-validation', async () => {
      await endpoint.setValueInBodyEditor('{"another_invalid":')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Clear input with valid JSON', async () => {
      await endpoint.setValueInBodyEditor(validJson)
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Clear input with empty string', async () => {
      await endpoint.setValueInBodyEditor('')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Play button should be disabled when invalid JSON is present', async () => {
      await endpoint.setValueInBodyEditor('{"invalid_json": "test",')
      await expect(endpoint.playButton).toBeDisabled()
    })

    await test.step('Play button should be enabled when valid JSON is present', async () => {
      await endpoint.setValueInBodyEditor(validJson)
      await expect(endpoint.playButton).toBeEnabled()
    })

    await test.step('Play button should play the request', async () => {
      await endpoint.setValueInBodyEditor(validJson)
      await expect(endpoint.playButton).toBeEnabled()
      await endpoint.playButton.click()
      await expect(endpoint.responseContainer).toBeVisible()
    })
  })
})
