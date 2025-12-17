import { useMemo } from 'react'
import { useObservabilityStore } from '../stores/use-observability-store'
import { deriveTraceGroup } from './use-derive-trace-group'

export const useFilteredTraceGroups = () => {
  const traceGroupMetas = useObservabilityStore((state) => state.traceGroupMetas)
  const tracesByGroupId = useObservabilityStore((state) => state.tracesByGroupId)
  const statusFilter = useObservabilityStore((state) => state.statusFilter)
  const search = useObservabilityStore((state) => state.search)

  return useMemo(() => {
    const traceGroups = traceGroupMetas.map((meta) => {
      const traces = tracesByGroupId[meta.id] || []
      if (traces.length === 0) {
        return {
          ...meta,
          status: 'running' as const,
          lastActivity: meta.startTime,
          metadata: {
            completedSteps: 0,
            activeSteps: 0,
            totalSteps: 0,
          },
        }
      }
      return deriveTraceGroup(meta, traces)
    })

    return traceGroups.filter((group) => {
      const matchesSearch =
        group.name.toLowerCase().includes(search.toLowerCase()) || group.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [traceGroupMetas, tracesByGroupId, search, statusFilter])
}
