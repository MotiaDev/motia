import { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Timer,
  XCircle,
} from 'lucide-react'
import type { WorkflowStep } from '@/lib/traceTransform'
import { formatDuration } from '@/lib/traceUtils'

interface WorkflowChainProps {
  steps: WorkflowStep[]
  selectedTraceId: string
  onSelectTrace: (traceId: string) => void
}

export function WorkflowChain({ steps, selectedTraceId, onSelectTrace }: WorkflowChainProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border-b border-[#1D1D1D]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Workflow ({steps.length} steps)
      </button>
      {expanded && (
        <div className="px-2 pb-2 space-y-0.5 max-h-48 overflow-y-auto">
          {steps.map((step) => {
            const isCurrent = step.traceId === selectedTraceId
            return (
              <button
                key={step.traceId}
                type="button"
                onClick={() => onSelectTrace(step.traceId)}
                className={`w-full flex items-center gap-1.5 py-1 px-2 rounded text-left transition-colors
                  ${isCurrent ? 'bg-yellow/10 ring-1 ring-yellow/30' : 'hover:bg-dark-gray/50'}
                `}
              >
                {step.status === 'ok' ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-success shrink-0" />
                ) : (
                  <XCircle className="w-2.5 h-2.5 text-error shrink-0" />
                )}
                <span className="text-[10px] font-mono text-cyan-400 truncate">{step.topic}</span>
                {step.downstreamFunction && (
                  <>
                    <ChevronRight className="w-2 h-2 text-gray-600 shrink-0" />
                    <span className="text-[10px] font-mono text-foreground truncate">
                      {step.downstreamFunction}
                    </span>
                  </>
                )}
                <span className="text-[9px] text-muted ml-auto shrink-0">
                  {formatDuration(step.duration)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
