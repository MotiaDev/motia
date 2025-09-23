import { TraceTimeline } from '@/components/observability/trace-timeline'
import { TraceGroup } from '@/types/observability'
import { useStreamGroup } from '@motiadev/stream-client-react'
import { TracesGroups } from '@/components/observability/traces-groups'
import { useGlobalStore } from '../../stores/use-global-store'
import { useEffect, useState, useMemo } from 'react'
import { Button, Input } from '@motiadev/ui'
import { Activity, CircleX } from 'lucide-react'

export const TracesPage = () => {
  const selectedGroupId = useGlobalStore((state) => state.selectedTraceGroupId)
  const selectTraceGroupId = useGlobalStore((state) => state.selectTraceGroupId)
  const { data } = useStreamGroup<TraceGroup>({ streamName: 'motia-trace-group', groupId: 'default' })
  const [isClearing, setIsClearing] = useState(false)
  const [search, setSearch] = useState('')
  const handleGroupSelect = (group: TraceGroup) => selectTraceGroupId(group.id)

  // Filter out system step traces and apply search
  const systemStepNames = ['Clear Traces', 'Clear State', 'Clear Logs', 'Event Emitter']
  const filteredData = useMemo(() => {
    const systemFiltered = data?.filter(group => !systemStepNames.includes(group.name)) || []
    
    if (!search) return systemFiltered
    
    return systemFiltered.filter((group) => {
      return (
        group.name.toLowerCase().includes(search.toLowerCase()) ||
        group.id.toLowerCase().includes(search.toLowerCase()) ||
        group.status.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [data, search])

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
    if (filteredData && filteredData.length > 0) {
      const group = filteredData[filteredData.length - 1]

      if (group && group.status === 'running' && group.id !== selectedGroupId) {
        selectTraceGroupId(group.id)
      }
    }
  }, [filteredData])

  return (
    <div className="flex flex-1 overflow-hidden h-full flex-col">
      <div className="flex p-2 border-b gap-4">
        <div className="flex-1 relative">
          <Input
            variant="shade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search traces by name, ID, or status..."
            className="pr-10 font-medium"
          />
          <CircleX
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground"
            onClick={() => setSearch('')}
          />
        </div>
        <Button variant="outline" onClick={clearTraces} disabled={isClearing}>
          <Activity className="h-4 w-4 mr-2" />
          {isClearing ? 'Clearing...' : 'Clear Traces'}
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 min-w-[300px] border-r border-border overflow-auto h-full" data-testid="traces-container">
          <TracesGroups groups={filteredData} selectedGroupId={selectedGroupId} onGroupSelect={handleGroupSelect} />
        </div>

        <div className="flex-1 overflow-auto" data-testid="trace-details">
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
