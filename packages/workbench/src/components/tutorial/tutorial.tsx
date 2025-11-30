import { motiaAnalytics } from '../../lib/motia-analytics'
import { useTutorialEngine } from './hooks/use-tutorial-engine'
import { TutorialStep } from './tutorial-step'
import './tutorial.css'

export const Tutorial = () => {
  const engine = useTutorialEngine()

  const onNext = () => {
    const currentStep = engine.currentStepRef.current
    const nextStep = currentStep + 1

    engine.moveStep(nextStep)

    if (engine.currentStep === engine.totalSteps) {
      motiaAnalytics.track('tutorial_completed', {
        manualOpen: engine.manualOpenRef.current,
      })
    } else {
      motiaAnalytics.track('tutorial_next_step', {
        step: nextStep,
        manualOpen: engine.manualOpenRef.current,
      })
    }
  }

  const onClose = () => {
    motiaAnalytics.track('tutorial_closed', {
      step: engine.currentStepRef.current,
      manualOpen: engine.manualOpenRef.current,
    })
    engine.onClose()
  }

  return (
    <div>
      {/* backdrop container */}
      <div className="fixed inset-0 z-[9999]" />

      {/* Highlighter container */}
      <div
        className="absolute top-5 left-5 w-full h-full rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-[10000] pointer-events-none"
        ref={engine.highlighterRef}
      />

      <TutorialStep
        ref={engine.ref}
        step={engine.currentStep}
        totalSteps={engine.totalSteps}
        title={engine.title}
        description={engine.description}
        link={engine.link}
        image={engine.image}
        onNext={onNext}
        onClose={onClose}
      />
    </div>
  )
}
