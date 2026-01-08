import { BackgroundEffect } from '@motiadev/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motiaAnalytics } from '../../lib/motia-analytics'
import type { WalkthroughConfig } from './engine/walkthrough-types'
import { WalkthroughCodeDisplay } from './walkthrough-code-display'
import './tutorial.css'

type WalkthroughPhase = 'welcome' | 'tutorial' | 'complete'

type CodeWalkthroughProps = {
  config: WalkthroughConfig
  code: string
  language?: string
  onClose: () => void
}

export const CodeWalkthrough: React.FC<CodeWalkthroughProps> = ({ config, code, language, onClose }) => {
  const [phase, setPhase] = useState<WalkthroughPhase>('welcome')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const currentStep = config.steps[currentStepIndex]
  const totalSteps = config.steps.length

  // Determine which comments are expanded
  const expandedComments = useMemo(() => {
    if (!currentStep) return new Set<string>()
    return new Set(currentStep.expandComments ?? [])
  }, [currentStep])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (phase === 'welcome') {
          handleStartTutorial()
        } else if (phase === 'tutorial') {
          handleNext()
        }
      } else if (e.key === 'ArrowLeft' && phase === 'tutorial') {
        e.preventDefault()
        handlePrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, currentStepIndex])

  const handleStartTutorial = useCallback(() => {
    setPhase('tutorial')
    setCurrentStepIndex(0)
    motiaAnalytics.track('walkthrough_started', { file: config.file })
  }, [config.file])

  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1)
      motiaAnalytics.track('walkthrough_next_step', { step: currentStepIndex + 2 })
    } else {
      setPhase('complete')
      motiaAnalytics.track('walkthrough_completed', { file: config.file })
    }
  }, [currentStepIndex, totalSteps, config.file])

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }, [currentStepIndex])

  const handleClose = useCallback(() => {
    motiaAnalytics.track('walkthrough_closed', { step: currentStepIndex, phase })
    onClose()
  }, [currentStepIndex, phase, onClose])

  // Welcome Phase
  if (phase === 'welcome') {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80">
        <div className="driver-popover max-w-md">
          {config.welcome.image && (
            <img
              src={config.welcome.image.src}
              alt="Welcome"
              className="driver-popover-image object-cover"
              style={{ height: config.welcome.image.height, width: '100%' }}
            />
          )}
          <div className="isolate relative">
            <BackgroundEffect />
            <div className="driver-popover-title">
              <h2 className="popover-title">{config.welcome.title}</h2>
            </div>
            <div className="px-4 pb-2 text-sm text-muted-foreground">{config.welcome.subtitle}</div>
            <div
              className="driver-popover-description"
              dangerouslySetInnerHTML={{ __html: config.welcome.description.replace(/\n/g, '<br/>') }}
            />
            <div className="driver-popover-footer flex items-center justify-between">
              <button className="tutorial-opt-out-button" onClick={handleClose}>
                Skip
              </button>
              <button className="driver-popover-next-btn" onClick={handleStartTutorial}>
                Start Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Complete Phase
  if (phase === 'complete') {
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80">
        <div className="driver-popover max-w-md">
          <div className="isolate relative">
            <BackgroundEffect />
            <div className="driver-popover-title">
              <h2 className="popover-title text-green-500">{config.completion.title}</h2>
            </div>
            <div
              className="driver-popover-description"
              dangerouslySetInnerHTML={{ __html: config.completion.description }}
            />
            <div className="flex flex-wrap gap-2 px-4 pb-4">
              {config.completion.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent-1000 hover:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="driver-popover-footer">
              <button className="driver-popover-next-btn" onClick={handleClose}>
                Explore Workbench
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tutorial Phase
  const progress = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <div className="fixed inset-0 z-9999 flex bg-background">
      {/* Code Panel */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        <div className="flex items-center py-2 px-4 bg-card border-b border-border">
          <span className="text-sm text-muted-foreground font-mono">{config.file}</span>
          <span className="ml-2 text-xs text-muted-foreground/60">Read only</span>
        </div>
        <div className="flex-1 overflow-hidden bg-background">
          <WalkthroughCodeDisplay
            code={code}
            language={language}
            focusLines={currentStep.focusLines}
            expandedComments={expandedComments}
            comments={config.comments}
            codeStyles={config.codeStyles}
          />
        </div>
      </div>

      {/* Tutorial Panel */}
      <div className="w-100 flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          {/* Progress Bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full bg-accent-1000 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mb-1">
            Step {currentStepIndex + 1} of {totalSteps}
          </div>
          <h2 className="text-lg font-semibold text-foreground">{currentStep.title}</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div
            className="driver-popover-description p-0!"
            dangerouslySetInnerHTML={{ __html: currentStep.description }}
          />
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            ← Previous
          </button>
          <button className="flex-1 driver-popover-next-btn" onClick={handleNext}>
            {currentStepIndex === totalSteps - 1 ? 'Complete →' : 'Next →'}
          </button>
        </div>

        <div className="px-4 pb-4">
          <button className="tutorial-opt-out-button w-full text-center" onClick={handleClose}>
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  )
}
