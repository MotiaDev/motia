import { ObservabilityStats } from '@/components/observability/observability-stats'
import { TraceTimeline } from '@/components/observability/trace-timeline'
import { TraceGroup } from '@/types/observability'
import { useStreamGroup } from '@motiadev/stream-client-react'
import { useState } from 'react'
import { TracesGroups } from '../components/observability/traces-groups'

export const TracesPage = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const { data } = useStreamGroup<TraceGroup>({ streamName: 'motia-trace-group', groupId: 'default' })

  const handleGroupSelect = (group: TraceGroup) => {
    setSelectedGroupId(group.id)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <ObservabilityStats groups={data} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-border overflow-auto">
          <TracesGroups groups={data} selectedGroupId={selectedGroupId} onGroupSelect={handleGroupSelect} />
        </div>

        <div className="flex-1 overflow-auto">
          {selectedGroupId && <TraceTimeline groupId={selectedGroupId} />}
          {!selectedGroupId && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a trace or trace group to view the timeline
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
