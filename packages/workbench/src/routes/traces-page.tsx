import { useState } from 'react'
import { TracesList } from '@/components/observability/traces-list'
import { TraceTimeline } from '@/components/observability/trace-timeline'
import { TraceSearch } from '@/components/observability/trace-search'
import { ObservabilityStats } from '@/components/observability/observability-stats'
import { Trace, TraceGroup, TraceFilter } from '@/types/observability'
import { useObservabilityListener } from '@/hooks/use-observability-listener'

export const TracesPage = () => {
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<TraceGroup | null>(null)
  const [groups] = useState<TraceGroup[]>([])
  const [filter, setFilter] = useState<TraceFilter>({})

  const traces = useObservabilityListener(filter)

  const handleTraceSelect = (trace: Trace) => {
    setSelectedTrace(trace)
    setSelectedGroup(null)
  }

  const handleGroupSelect = (group: TraceGroup) => {
    setSelectedGroup(group)
    setSelectedTrace(null)
  }

  const handleSearch = (searchFilter: TraceFilter) => {
    setFilter(searchFilter)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Observability</h1>
          <ObservabilityStats traces={traces} groups={groups} />
        </div>
        <TraceSearch onSearch={handleSearch} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-border">
          <TracesList
            traces={traces}
            groups={groups}
            selectedTrace={selectedTrace}
            selectedGroup={selectedGroup}
            onTraceSelect={handleTraceSelect}
            onGroupSelect={handleGroupSelect}
          />
        </div>

        <div className="flex-1">
          {selectedTrace && <TraceTimeline trace={selectedTrace} />}
          {selectedGroup && <TraceTimeline group={selectedGroup} />}
          {!selectedTrace && !selectedGroup && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a trace or trace group to view the timeline
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
