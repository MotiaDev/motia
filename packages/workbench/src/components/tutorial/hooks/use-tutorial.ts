import { useEffect, useState } from 'react'
import { MotiaTutorial } from '../engine/tutorial-engine'
import type { TutorialStep } from '../engine/tutorial-types'

export const useTutorial = () => {
  const open = () => MotiaTutorial.open()
  const [steps, setSteps] = useState<TutorialStep[]>([])

  useEffect(() => {
    MotiaTutorial.onStepsRegistered(() => setSteps(MotiaTutorial.steps))
  }, [])

  return { open, steps }
}
