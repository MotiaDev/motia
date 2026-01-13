import { Check, Lock, Play } from 'lucide-react'
import type { FC } from 'react'
import type { TutorialStepConfig } from './quickstart-store'

type QuickstartNavProps = {
  steps: TutorialStepConfig[]
  activeStepId: string | null
  visitedStepIds: Set<string>
  onStepClick: (stepId: string) => void
  onRun: () => void
}

export const QuickstartNav: FC<QuickstartNavProps> = ({ steps, activeStepId, visitedStepIds, onStepClick, onRun }) => {
  const getMaxUnlockedIndex = () => {
    let maxIndex = 0
    for (let i = 0; i < steps.length; i++) {
      if (visitedStepIds.has(steps[i].id)) {
        maxIndex = i + 1
      } else {
        break
      }
    }
    return maxIndex
  }

  const maxUnlockedIndex = getMaxUnlockedIndex()
  const allStepsVisited = visitedStepIds.size === steps.length

  const handleStepClick = (stepId: string, index: number) => {
    if (index > maxUnlockedIndex) return
    onStepClick(stepId)
  }

  return (
    <div className="flex flex-col gap-1 p-3 border-r border-border bg-muted/30 min-w-50">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Steps</div>
      {steps.map((step, index) => {
        const isActive = step.id === activeStepId
        const isVisited = visitedStepIds.has(step.id)
        const isLocked = index > maxUnlockedIndex

        return (
          <button
            key={step.id}
            onClick={() => handleStepClick(step.id, index)}
            disabled={isLocked}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
              ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
              ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
            `}
          >
            <span
              className={`
              flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
              ${isActive ? 'bg-primary-foreground text-primary' : isVisited ? 'bg-green-500/20 text-green-500' : 'bg-muted-foreground/20 text-muted-foreground'}
            `}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : isVisited ? <Check className="w-3 h-3" /> : index + 1}
            </span>
            <span className="text-sm font-medium">{step.title}</span>
          </button>
        )
      })}

      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={onRun}
          disabled={!allStepsVisited}
          className={`
            flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg font-medium transition-colors
            ${allStepsVisited ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-muted text-muted-foreground cursor-not-allowed'}
          `}
        >
          <Play className="w-4 h-4" />
          Run
        </button>
      </div>
    </div>
  )
}
