import './theme.css'
import { TutorialConfig, TutorialStep } from './types/tutorial'
import driver from './driver'
import { tutorials } from './tutorials'
import { closeTutorial } from './close'
import { Driver, PopoverDOM } from 'driver.js'

const getSteps = (tutorialId: string) => {
  if (tutorialId in tutorials) {
    return tutorials[tutorialId as keyof typeof tutorials].steps
  }

  return tutorials.basic.steps
}

const waitForElement = (xpath: string, onElementFound: () => void, onTimeoutExpired: () => void) => {
  // add logic to wait for an element to be present, with a max timeout of 60 seconds
  let timeout = 5000
  // change the interval for a while loop
  while (timeout > 0) {
    const element = xpath.match(/\/\//)
      ? document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue
      : document.querySelector(xpath)

    if (element) {
      onElementFound()
      return
    }

    timeout -= 300

    if (timeout === 0) {
      console.error('Timeout waiting for element', xpath)
      onTimeoutExpired()
    }
  }
}

export const startTutorial = (config?: TutorialConfig) => {
  if (window.localStorage.getItem('motia-tutorial-skipped') && !config?.resetSkipState) {
    return
  }

  if (config?.resetSkipState) {
    window.localStorage.removeItem('motia-tutorial-skipped')
  }

  const tutorialId = config?.tutorialId ?? 'basic'

  let tutorialDriver: Driver | undefined

  console.log('Starting tutorial', { tutorialId })

  const steps = getSteps(tutorialId)

  if (!steps.length) {
    console.error('No steps found for tutorial', { tutorialId })
    return
  }

  const driveTutorial = () => {
    tutorialDriver = driver({
      showProgress: true,
      onPopoverRender: (popover: PopoverDOM) => {
        const container = document.createElement('div')
        container.className = 'tutorial-opt-out-container'
        const secondButton = document.createElement('button')
        secondButton.innerText = 'Never show again'
        secondButton.className = 'tutorial-opt-out-button'
        secondButton.type = 'button'

        secondButton.addEventListener('click', () => {
          tutorialDriver?.destroy()
          window.localStorage.setItem('motia-tutorial-skipped', 'true')
        })

        container.appendChild(secondButton)
        popover.wrapper.appendChild(container)
      },
      // NOTE: we map the internal step definitions into the Driver.js structure in order to avoid injecting dependencies from the UI into the step definitions
      steps: steps.map((step: TutorialStep) => ({
        element: step.elementXpath.match('//')
          ? () => {
              const result = document.evaluate(
                step.elementXpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null,
              )
              return result.singleNodeValue as Element
            }
          : step.elementXpath,
        popover: {
          title: `<h3 class="popover-title">${step.title}</h3>`,
          description: `<p class="popover-description">${step.description}</p>`,
          position: step.position,
          onNextClick: () => {
            if (tutorialDriver?.isLastStep()) {
              window.localStorage.setItem('motia-tutorial-skipped', 'true')
            }

            if (step.runScriptBeforeNext) {
              step.runScriptBeforeNext()
            }

            if (step.clickSelectorBeforeNext) {
              const element = document.evaluate(
                step.clickSelectorBeforeNext,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null,
              )

              if (element.singleNodeValue) {
                if (step.useKeyDownEventOnClickBeforeNext) {
                  ;(element.singleNodeValue as HTMLElement).dispatchEvent(
                    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }),
                  )
                } else {
                  ;(element.singleNodeValue as HTMLElement).click()
                }
              }
            }

            if (step.waitForSelector) {
              // add logic to wait for an element to be present, with a max timeout of 60 seconds
              let timeout = 5000
              let interval = setInterval(() => {
                const element = document.evaluate(
                  step.waitForSelector!,
                  document,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null,
                )

                if (element.singleNodeValue) {
                  tutorialDriver?.moveNext()
                  clearInterval(interval)
                }

                timeout -= 300

                if (timeout === 0) {
                  console.error('Timeout waiting for element', step.waitForSelector)
                  tutorialDriver?.moveNext()
                  clearInterval(interval)
                }
              }, 300)

              return
            }

            tutorialDriver?.moveNext()
          },
          ...(step.id === 'intro' ? { popoverClass: 'driver-popover driver-popover-intro-step' } : {}),
        },
      })),
      onDestroyStarted: () => {
        if (tutorialDriver?.isLastStep()) {
          window.localStorage.setItem('motia-tutorial-skipped', 'true')
        }

        closeTutorial(true)
      },
      onDestroyed: () => {
        closeTutorial(true)
      },
    })

    tutorialDriver.drive(config?.initialStepIndex)
  }

  waitForElement(
    steps[0].elementXpath,
    () => driveTutorial(),
    () => {
      alert(`Oops! We've encountered an issue while loading the tutorial. Please contact support.`)
    },
  )
}
