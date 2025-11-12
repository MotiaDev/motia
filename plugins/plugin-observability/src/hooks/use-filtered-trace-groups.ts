import { useStreamGroup } from '@motiadev/stream-client-react'
import { useMemo } from 'react'
import { useObservabilityStore } from '@/stores/use-observability-store'
import type { TraceGroup } from '../types/observability'

export const useFilteredTraceGroups = () => {
  const streamGroupArgs = useMemo(() => ({ streamName: 'motia-trace-group', groupId: 'default' }), [])
  const { data } = useStreamGroup<TraceGroup>(streamGroupArgs)

  const search = useObservabilityStore((state) => state.search)

  return useMemo(
    () =>
      data?.filter(
        (group) =>
          group.name.toLowerCase().includes(search.toLowerCase()) ||
          group.id.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  )
}
