import type { FC } from 'react'
import type { TutorialStepConfig } from './quickstart-store'

type QuickstartNavProps = {
  steps: TutorialStepConfig[]
  activeStepId: string | null
  onStepClick: (stepId: string) => void
}

export const QuickstartNav: FC<QuickstartNavProps> = ({ steps, activeStepId, onStepClick }) => {
  return (
    <div className="flex flex-col gap-1 p-3 border-r border-border bg-muted/30 min-w-50">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Steps</div>
      {steps.map((step, index) => {
        const isActive = step.id === activeStepId
        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
              ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
            `}
          >
            <span
              className={`
              flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
              ${isActive ? 'bg-primary-foreground text-primary' : 'bg-muted-foreground/20 text-muted-foreground'}
            `}
            >
              {index + 1}
            </span>
            <span className="text-sm font-medium">{step.title}</span>
          </button>
        )
      })}
    </div>
  )
}
