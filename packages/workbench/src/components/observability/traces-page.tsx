import { TraceTimeline } from '@/components/observability/trace-timeline'
import { TraceGroup } from '@/types/observability'
import { useStreamGroup } from '@motiadev/stream-client-react'
import { TracesGroups } from '@/components/observability/traces-groups'
import { useGlobalStore } from '../../stores/use-global-store'
import { useEffect, useState } from 'react'
import { Button } from '@motiadev/ui'
import { Activity } from 'lucide-react'

export const TracesPage = () => {
  const selectedGroupId = useGlobalStore((state) => state.selectedTraceGroupId)
  const selectTraceGroupId = useGlobalStore((state) => state.selectTraceGroupId)
  const { data } = useStreamGroup<TraceGroup>({ streamName: 'motia-trace-group', groupId: 'default' })
  const [isClearing, setIsClearing] = useState(false)
  const handleGroupSelect = (group: TraceGroup) => selectTraceGroupId(group.id)

  const clearTraces = async () => {
    setIsClearing(true)
    try {
      const response = await fetch('/__motia/clear-traces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // The traces will automatically refresh via useStreamGroup
    } catch (error) {
      console.error('Error clearing traces:', error)
    } finally {
      setIsClearing(false)
    }
  }

  useEffect(() => {
    if (data && data.length > 0) {
      const group = data[data.length - 1]

      if (group && group.status === 'running' && group.id !== selectedGroupId) {
        selectTraceGroupId(group.id)
      }
    }
  }, [data])

  return (
    <div className="flex flex-1 overflow-hidden h-full flex-col">
      <div className="flex p-2 border-b gap-4">
        <div className="flex-1" />
        <Button variant="outline" onClick={clearTraces} disabled={isClearing}>
          <Activity className="h-4 w-4 mr-2" />
          {isClearing ? 'Clearing...' : 'Clear Traces'}
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="max-w-1/3 border-r border-border overflow-auto h-full" data-testid="traces-container">
          <TracesGroups groups={data} selectedGroupId={selectedGroupId} onGroupSelect={handleGroupSelect} />
        </div>

        <div className="flex-2 overflow-auto" data-testid="trace-details">
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
