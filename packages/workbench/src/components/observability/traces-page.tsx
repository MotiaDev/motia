import { TraceTimeline } from '@/components/observability/trace-timeline'
import { TraceGroup } from '@/types/observability'
import { useStreamGroup } from '@motiadev/stream-client-react'
import { TracesGroups } from '@/components/observability/traces-groups'
import { useGlobalStore } from '../../stores/use-global-store'
import { useEffect, useMemo, useState } from 'react'
import { Button, cn, Input } from '@motiadev/ui'
import { Search, Trash, X } from 'lucide-react'

export const TracesPage = () => {
  const selectedGroupId = useGlobalStore((state) => state.selectedTraceGroupId)
  const selectTraceGroupId = useGlobalStore((state) => state.selectTraceGroupId)
  const { data } = useStreamGroup<TraceGroup>({ streamName: 'motia-trace-group', groupId: 'default' })
  const handleGroupSelect = (group: TraceGroup) => selectTraceGroupId(group.id)
  const [search, setSearch] = useState('')
  const clearTraces = () => fetch('/__motia/trace/clear', { method: 'POST' })
  const traceGroups = useMemo(
    () =>
      data?.filter(
        (group) =>
          group.name.toLowerCase().includes(search.toLowerCase()) ||
          group.id.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  )

  useEffect(() => {
    if (traceGroups && traceGroups.length > 0) {
      const group = traceGroups[traceGroups.length - 1]

      if (group && group.status === 'running' && group.id !== selectedGroupId) {
        selectTraceGroupId(group.id)
      }
    } else if (selectedGroupId) {
      selectTraceGroupId(undefined)
    }
  }, [traceGroups])

  return (
    <div className="grid grid-rows-[auto_1fr] h-full">
      <div className="flex p-2 border-b gap-2" data-testid="logs-search-container">
        <div className="flex-1 relative">
          <Input
            variant="shade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-9 font-medium"
            placeholder="Search by Trace ID or Step Name"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <X
            className={cn(
              'cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground',
              {
                visible: search !== '',
                invisible: search === '',
              },
            )}
            onClick={() => setSearch('')}
          />
        </div>
        <Button variant="default" onClick={clearTraces} className="h-[34px]">
          <Trash /> Clear
        </Button>
      </div>

      <div className="grid grid-cols-[300px_1fr] overflow-hidden">
        <div className="w-[300px] border-r border-border overflow-auto h-full" data-testid="traces-container">
          <TracesGroups groups={traceGroups} selectedGroupId={selectedGroupId} onGroupSelect={handleGroupSelect} />
        </div>

        <div className="overflow-auto" data-testid="trace-details">
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
