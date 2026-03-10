import { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Timer,
  XCircle,
} from 'lucide-react'
import type { WorkflowRun } from '@/lib/traceTransform'
import { formatDuration } from '@/lib/traceUtils'

interface WorkflowViewProps {
  runs: WorkflowRun[]
  onSelectTrace: (traceId: string) => void
}

function formatTime(timestamp: number): string {
  const ms = timestamp > 4102444800000 ? timestamp / 1_000_000 : timestamp
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return '--:--:--'
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function WorkflowView({ runs, onSelectTrace }: WorkflowViewProps) {
  if (runs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center max-w-xs">
          <div className="w-10 h-10 mb-3 mx-auto rounded-lg bg-dark-gray border border-border flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-muted" />
          </div>
          <h3 className="text-xs font-medium mb-1 text-foreground">No workflows found</h3>
          <p className="text-[11px] text-muted leading-relaxed">
            Workflow chains will appear here once enqueue traces are available and cached.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {runs.map((run) => (
        <WorkflowRunCard key={run.id} run={run} onSelectTrace={onSelectTrace} />
      ))}
    </div>
  )
}

function WorkflowRunCard({
  run,
  onSelectTrace,
}: {
  run: WorkflowRun
  onSelectTrace: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasError = run.steps.some((s) => s.status === 'error')

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-dark-gray/50 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
        )}
        {hasError ? (
          <XCircle className="w-3.5 h-3.5 text-error flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
        )}
        <span className="text-xs font-medium text-foreground truncate">
          {run.steps[0]?.topic ?? 'Workflow'}
        </span>
        <span className="text-[10px] text-muted ml-auto flex items-center gap-3 flex-shrink-0">
          <span>{run.steps.length} steps</span>
          <span className="flex items-center gap-1">
            <Timer className="w-2.5 h-2.5" />
            {formatDuration(run.totalDuration)}
          </span>
          <span>{formatTime(run.startTime)}</span>
        </span>
      </button>

      {expanded && (
        <div className="pb-2">
          {run.steps.map((step, i) => (
            <button
              key={`${step.traceId}-${step.topic}`}
              type="button"
              onClick={() => onSelectTrace(step.traceId)}
              className="w-full flex items-center gap-2 py-1.5 hover:bg-dark-gray/30 transition-colors text-left"
              style={{ paddingLeft: `${i * 16 + 24}px`, paddingRight: '12px' }}
            >
              <span className="text-[10px] text-gray-600 flex-shrink-0">→</span>
              {step.status === 'ok' ? (
                <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-error flex-shrink-0" />
              )}
              <span className="text-[11px] font-mono text-cyan-400 truncate">
                enqueue: {step.topic}
              </span>
              {step.downstreamFunction && (
                <>
                  <ChevronRight className="w-2.5 h-2.5 text-gray-600 flex-shrink-0" />
                  <span className="text-[11px] font-mono text-foreground truncate">
                    {step.downstreamFunction}
                  </span>
                </>
              )}
              <span className="text-[10px] text-muted ml-auto flex-shrink-0 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Timer className="w-2.5 h-2.5" />
                  {formatDuration(step.duration)}
                </span>
                <code className="font-mono">{step.traceId.slice(0, 8)}</code>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
