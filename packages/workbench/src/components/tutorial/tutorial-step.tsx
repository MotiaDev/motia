import { BackgroundEffect } from '@motiadev/ui'
import type React from 'react'
import { forwardRef, useEffect } from 'react'
import type { TutorialImage } from './engine/tutorial-types'

type TutorialStepProps = {
  step: number
  totalSteps: number
  title: string
  description: React.ReactNode
  link?: string
  image?: TutorialImage
  onNext: () => void
  onClose: () => void
}

export const TutorialStep = forwardRef<HTMLDivElement, TutorialStepProps>(
  ({ step, totalSteps, title, description, link, image, onNext, onClose }, ref) => {
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (step > 0 && e.key === 'Escape') {
          onClose()
        } else if (step > 0 && e.key === 'ArrowRight') {
          onNext()
        }
      }
      window.addEventListener('keydown', handleKeyDown)

      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, onNext, step])

    return (
      <div ref={ref} className="driver-popover ">
        {image && (
          <img
            src={image.src}
            alt="Step visual"
            className="driver-popover-image object-cover"
            style={{ height: image.height, width: '100%' }}
          />
        )}

        <div className="isolate relative">
          <BackgroundEffect />
          <div className="driver-popover-title">
            <h2 className="popover-title">{title}</h2>
          </div>

          <div className="driver-popover-description">{description}</div>

          {link && (
            <a href={link} target="_blank" className="text-foreground text-xs font-semibold px-4 hover:underline">
              Learn more
            </a>
          )}

          <div className="driver-popover-footer flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-semibold">
              {step} <span className="text-foreground">/</span> {totalSteps}
            </div>

            <div className="driver-popover-navigation-btns driver-popover-navigation-btns-hint flex gap-2">
              <button className="driver-popover-next-btn" onClick={onNext}>
                {step < totalSteps ? 'Continue' : 'Finish'}
              </button>
            </div>
          </div>

          {step < totalSteps && (
            <div className="tutorial-opt-out-container">
              <button className="tutorial-opt-out-button" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    )
  },
)

TutorialStep.displayName = 'TutorialStep'
