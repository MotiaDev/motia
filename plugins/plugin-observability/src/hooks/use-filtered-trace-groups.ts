import { useMemo } from 'react'
import { useObservabilityStore } from '../stores/use-observability-store'

export const useFilteredTraceGroups = () => {
  const traceGroups = useObservabilityStore((state) => state.traceGroups)
  const search = useObservabilityStore((state) => state.search)

  return useMemo(
    () =>
      traceGroups.filter(
        (group) =>
          group.name.toLowerCase().includes(search.toLowerCase()) ||
          group.id.toLowerCase().includes(search.toLowerCase()),
      ),
    [traceGroups, search],
  )
}
