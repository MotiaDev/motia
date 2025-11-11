import type React from 'react'
import { memo, useEffect, useMemo } from 'react'
import { useObservabilityStore } from '@/stores/use-observability-store'
import { useFilteredTraceGroups } from '../hooks/use-filtered-trace-groups'
import { TraceGroupItem } from './trace-group-item'

export const TracesGroups: React.FC = memo(() => {
  const groups = useFilteredTraceGroups()
  const selectedGroupId = useObservabilityStore((state) => state.selectedTraceGroupId)
  const selectTraceGroupId = useObservabilityStore((state) => state.selectTraceGroupId)

  const groupsLength = useMemo(() => groups?.length || 0, [groups])
  const lastRunningGroupId = useMemo(() => {
    if (!groups || groups.length === 0) return ''
    const lastGroup = groups[groups.length - 1]
    return lastGroup?.status === 'running' ? lastGroup.id : ''
  }, [groups])

  useEffect(() => {
    if (lastRunningGroupId && lastRunningGroupId !== selectedGroupId) {
      selectTraceGroupId(lastRunningGroupId)
    } else if (!lastRunningGroupId && !groupsLength && selectedGroupId) {
      selectTraceGroupId('')
    }
  }, [lastRunningGroupId, groupsLength])

  const reversedGroups = useMemo(() => [...groups].reverse(), [groups])

  if (!groups || groups.length === 0) {
    return null
  }

  return (
    <div className="overflow-auto">
      {reversedGroups.map((group) => (
        <TraceGroupItem
          key={group.id}
          groupId={group.id}
          groupName={group.name}
          groupStatus={group.status}
          groupStartTime={group.startTime}
          groupEndTime={group.endTime}
          totalSteps={group.metadata.totalSteps}
          activeSteps={group.metadata.activeSteps}
          isSelected={selectedGroupId === group.id}
        />
      ))}
    </div>
  )
})
TracesGroups.displayName = 'TracesGroups'
