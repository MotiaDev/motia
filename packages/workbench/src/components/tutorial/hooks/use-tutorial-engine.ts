import { useEffect, useRef, useState } from 'react'
import { MotiaTutorial } from '../engine/tutorial-engine'
import type { TutorialImage } from '../engine/tutorial-types'
import { waitForElementByXPath } from './tutorial-utils'

export const useTutorialEngine = () => {
  const ref = useRef<HTMLDivElement>(null)
  const highlighterRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<React.ReactNode | undefined>(undefined)
  const [image, setImage] = useState<TutorialImage | undefined>(undefined)
  const [link, setLink] = useState<string | undefined>(undefined)
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(MotiaTutorial.steps.length)

  const manualOpenRef = useRef(false)
  const loading = useRef(false)
  const currentStepRef = useRef(0)

  const moveComponent = (x: number, y: number) => {
    if (ref.current) {
      ref.current.style.position = 'absolute'
      ref.current.style.left = `${x}px`
      ref.current.style.top = `${y}px`
    }
  }

  const moveStep = async (stepNumber: number) => {
    const container = ref.current

    if (container && !loading.current) {
      if (stepNumber >= MotiaTutorial.steps.length) {
        onClose()
        return
      }

      if (container.parentElement) {
        container.style.transition = 'all 0.3s ease-in-out'
        container.parentElement.style.opacity = '1'
        container.parentElement.style.display = 'block'
      }

      loading.current = true
      currentStepRef.current = stepNumber

      const step = MotiaTutorial.steps[stepNumber]

      // Run any before actions
      if (step.before) {
        for (const action of step.before) {
          const monaco = (window as any).monaco
          if (action.type === 'click') {
            const element = await waitForElementByXPath(action.selector, action.optional)

            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              element.click()
              element.dispatchEvent(
                new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }),
              )
            }
          } else if (action.type === 'fill-editor' && monaco) {
            monaco.editor?.getEditors?.()?.[0]?.setValue(JSON.stringify(action.content, null, 2))
          }
        }
      }

      setCurrentStep(stepNumber + 1)
      setTitle(step.title)
      setDescription(await step.description())
      setImage(step.image)
      setLink(step.link)

      setTimeout(async () => {
        const { height, width } = container.getBoundingClientRect()

        if (step.elementXpath) {
          const targetElement = await waitForElementByXPath(step.elementXpath)

          if (!targetElement) {
            console.warn(`Element not found after maximum attempts: ${step.elementXpath}`)
            loading.current = false
            return
          }

          if (targetElement && highlighterRef.current) {
            const { top, left, width, height } = targetElement.getBoundingClientRect()
            highlighterRef.current.style.top = `${top - 0}px`
            highlighterRef.current.style.left = `${left - 0}px`
            highlighterRef.current.style.width = `${width + 0}px`
            highlighterRef.current.style.height = `${height + 0}px`
          }

          // Position tutorial relative to target element
          if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect()
            const spaceBelow = window.innerHeight - targetRect.bottom
            const spaceAbove = targetRect.top
            const spaceRight = window.innerWidth - targetRect.right
            const spaceLeft = targetRect.left

            // Helper function to adjust horizontal position within viewport bounds
            const adjustHorizontalPosition = (x: number) => {
              // this is important to avoid the tutorial from overflowing at far left or right
              return Math.max(20, Math.min(x, window.innerWidth - width - 20))
            }

            // Try to position below first
            if (spaceBelow >= height + 20) {
              const x = targetRect.left + targetRect.width / 2 - width / 2
              moveComponent(adjustHorizontalPosition(x), targetRect.bottom + 20)
            }
            // Try above if not enough space below
            else if (spaceAbove >= height + 20) {
              const x = targetRect.left + targetRect.width / 2 - width / 2
              moveComponent(adjustHorizontalPosition(x), targetRect.top - height - 20)
            }
            // Try right side
            else if (spaceRight >= width + 20) {
              moveComponent(targetRect.right + 20, targetRect.top + targetRect.height / 2 - height / 2)
            }
            // Try left side
            else if (spaceLeft >= width + 20) {
              moveComponent(targetRect.left - width - 20, targetRect.top + targetRect.height / 2 - height / 2)
            }
          }
        } else {
          if (highlighterRef.current) {
            highlighterRef.current.style.top = '50%'
            highlighterRef.current.style.left = '50%'
            highlighterRef.current.style.width = '1px'
            highlighterRef.current.style.height = '1px'
          }
          // Fallback to center of screen
          moveComponent(window.innerWidth / 2 - width / 2, window.innerHeight / 2 - height / 2)
        }
      }, 1)

      loading.current = false
    }
  }

  const onClose = () => {
    if (ref.current?.parentElement) {
      ref.current.parentElement.style.transition = 'opacity 0.3s ease-out'
      ref.current.parentElement.style.opacity = '0'
      localStorage.setItem('motia-tutorial-closed', 'true')

      setTimeout(() => {
        if (ref.current?.parentElement) {
          ref.current.parentElement.style.display = 'none'
          setCurrentStep(0)
        }
      }, 300)
    }
  }

  useEffect(() => {
    importFile('tutorial/tutorial.tsx')
      .then((module) => {
        if (Array.isArray(module.steps) && module.steps.length > 0) {
          MotiaTutorial.register(module.steps)
        }
      })
      .catch((error) => {
        // Tutorial file is optional, so we don't need to throw an error
        console.log('Tutorial file not found or could not be loaded:', error.message)
      })
  }, [])

  useEffect(() => {
    const container = ref.current

    if (container?.parentElement) {
      container.parentElement.style.display = 'none'
    }

    const onOpen = () => {
      if (container?.parentElement) {
        setTotalSteps(MotiaTutorial.steps.length)
        moveStep(0)
      }
    }

    MotiaTutorial.onOpen(() => {
      manualOpenRef.current = true
      onOpen()
    })

    MotiaTutorial.onStepsRegistered(() => {
      if (localStorage.getItem('motia-tutorial-closed') !== 'true') {
        manualOpenRef.current = false
        onOpen()
      }
    })
  }, [])

  return {
    ref,
    highlighterRef,
    title,
    description,
    image,
    link,
    currentStep,
    totalSteps,
    onClose,
    moveStep,
    currentStepRef,
    manualOpenRef,
  }
}
