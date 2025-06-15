import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TraceGroup } from '@/types/observability'
import { formatDistanceToNow } from 'date-fns'
import { TraceStatus, TraceStatusBadge } from './trace-status'

interface Props {
  groups: TraceGroup[]
  selectedGroupId: string | null
  onGroupSelect: (group: TraceGroup) => void
}

export const TracesGroups: React.FC<Props> = ({ groups, selectedGroupId, onGroupSelect }) => {
  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  return (
    <div className="overflow-auto p-4 space-y-4 ">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trace Groups</h2>
        <div className="text-xs text-muted-foreground">{groups.length} total</div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-2">
          {[...groups].reverse().map((group) => (
            <Card
              key={group.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedGroupId === group.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onGroupSelect(group)}
            >
              <CardContent className="p-3">
                <div className="flex flex-row justify-between mb-2">
                  <TraceStatus status={group.status} name={group.name} />
                  <TraceStatusBadge status={group.status} />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>{group.metadata.totalSteps} steps</span>
                  </div>
                  <div className="flex justify-between">
                    {group.endTime && <span>Duration: {formatDuration(group.endTime - group.startTime)}</span>}
                    <span>{formatDistanceToNow(group.startTime)} ago</span>
                  </div>
                  {group.metadata.activeSteps > 0 && (
                    <div className="text-blue-600">{group.metadata.activeSteps} active</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
