import { memo, useEffect } from 'react'
import { useObservabilityStore } from '../stores/use-observability-store'
import { SearchBar } from './search-bar'
import { TraceEmptyState } from './trace-empty-state'
import { TraceTimeline } from './trace-timeline'
import { TracesGroups } from './traces-groups'

export const ObservabilityPage = memo(() => {
  const setSearch = useObservabilityStore((state) => state.setSearch)
  const selectTraceGroupId = useObservabilityStore((state) => state.selectTraceGroupId)

  useEffect(() => {
    const handleNavigateToTrace = (event: CustomEvent<{ traceId: string }>) => {
      const { traceId } = event.detail
      if (traceId) {
        // Set search to the trace ID
        setSearch(traceId)
        // Select the trace group
        selectTraceGroupId(traceId)
      }
    }

    window.addEventListener('motia:navigate-to-trace', handleNavigateToTrace as EventListener)

    return () => {
      window.removeEventListener('motia:navigate-to-trace', handleNavigateToTrace as EventListener)
    }
  }, [setSearch, selectTraceGroupId])

  return (
    <div className="grid grid-rows-[auto_1fr] h-full">
      <SearchBar />

      <div className="grid grid-cols-[300px_1fr] overflow-hidden">
        <div className="w-[300px] border-r border-border overflow-auto h-full" data-testid="traces-container">
          <TracesGroups />
        </div>

        <div className="overflow-auto" data-testid="trace-details">
          <TraceTimeline />
          <TraceEmptyState />
        </div>
      </div>
    </div>
  )
})
ObservabilityPage.displayName = 'ObservabilityPage'
