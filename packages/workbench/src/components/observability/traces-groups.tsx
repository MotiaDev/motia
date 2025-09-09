import { formatDistanceToNow } from 'date-fns'
import type React from 'react'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { TraceGroup } from '@/types/observability'
import { TraceStatusBadge } from './trace-status'

interface Props {
  groups: TraceGroup[]
  selectedGroupId?: string
  onGroupSelect: (group: TraceGroup) => void
}

export const TracesGroups: React.FC<Props> = memo(({ groups, selectedGroupId, onGroupSelect }) => {
  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  return (
    <div className="overflow-auto">
      {groups.length > 0 && (
        <div>
          {[...groups].reverse().map((group) => (
            <div
              data-testid={`trace-${group.id}`}
              key={group.id}
              className={cn(
                'motia-trace-group cursor-pointer transition-colors',
                selectedGroupId === group.id ? 'bg-muted-foreground/10' : 'hover:bg-muted/70',
              )}
              onClick={() => onGroupSelect(group)}
            >
              <div className="p-3 flex flex-col gap-1">
                <div className="flex flex-row justify-between items-center gap-2">
                  <span className="font-semibold text-lg">{group.name}</span>
                  <TraceStatusBadge
                    status={group.status}
                    duration={group.endTime ? formatDuration(group.endTime - group.startTime) : undefined}
                  />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <div data-testid="trace-id" className="text-xs text-muted-foreground font-mono tracking-[1px]">
                      {group.id}
                    </div>
                    <span>{group.metadata.totalSteps} steps</span>
                  </div>
                  <div className="flex justify-between">{formatDistanceToNow(group.startTime)} ago</div>
                  {group.metadata.activeSteps > 0 && (
                    <div className="text-blue-600">{group.metadata.activeSteps} active</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
