export const waitForElementByXPath = async (
  xpath: string,
  optional = false,
  maxAttempts = 50,
  delayMs = 50,
): Promise<HTMLElement | null> => {
  let attempts = 0

  while (attempts < maxAttempts) {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const targetElement = result?.singleNodeValue as HTMLElement | undefined

    if (targetElement) {
      return targetElement
    } else if (optional) {
      return null
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
    attempts++
  }

  console.warn(`Element not found after maximum attempts: ${xpath}`)

  return null
}
