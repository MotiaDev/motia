import { cn } from '@/lib/utils'
import { Trace, TraceGroup } from '@/types/observability'
import React from 'react'

type Props = {
  trace: Trace
  group: TraceGroup
  groupEndTime: number
  onExpand: (traceId: string) => void
}

export const TraceItem: React.FC<Props> = ({ trace, group, groupEndTime, onExpand }) => {
  return (
    <div
      className="flex hover:bg-muted-foreground/10 relative cursor-pointer"
      onClick={() => onExpand(trace.id)}
      data-testid="trace-timeline-item"
    >
      <div className="flex items-center min-w-[200px] max-w-[200px] h-[32px] max-h-[32px] py-4 px-2 text-sm font-semibold text-foreground truncate sticky left-0 bg-card z-9">
        {trace.name}
      </div>
      <div className="flex w-full flex-row items-center hover:bg-muted/50 rounded-md">
        <div className="relative w-full h-[32px] flex items-center">
          <div
            className={cn('h-[24px] rounded-[4px] hover:opacity-80 transition-all duration-200', {
              'bg-[repeating-linear-gradient(140deg,#BEFE29,#BEFE29_8px,#ABE625_8px,#ABE625_16px)]':
                trace.status === 'running',
              'bg-[repeating-linear-gradient(140deg,#2862FE,#2862FE_8px,#2358E5_8px,#2358E5_16px)]':
                trace.status === 'completed',
              'bg-[repeating-linear-gradient(140deg,#EA2069,#EA2069_8px,#D41E60_8px,#D41E60_16px)]':
                trace.status === 'failed',
            })}
            style={{
              marginLeft: `${((trace.startTime - group.startTime) / (groupEndTime - group.startTime)) * 100}%`,
              width: trace.endTime
                ? `${((trace.endTime - trace.startTime) / (groupEndTime - group.startTime)) * 100}%`
                : `${((Date.now() - trace.startTime) / (groupEndTime - group.startTime)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
