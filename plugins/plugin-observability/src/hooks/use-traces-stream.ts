import { useStreamGroup } from '@motiadev/stream-client-react'
import { useObservabilityStore } from '../stores/use-observability-store'
import type { Trace } from '../types/observability'

const streamName = 'motia-trace'

export const useTracesStream = () => {
  const groupId = useObservabilityStore((state) => state.selectedTraceGroupId)
  const setData = useObservabilityStore((state) => state.setTraces)
  const setTracesForGroup = useObservabilityStore((state) => state.setTracesForGroup)

  useStreamGroup<Trace>({
    streamName,
    groupId,
    setData: (traces: Trace[]) => {
      setData(traces)
      if (groupId) {
        setTracesForGroup(groupId, traces)
      }
    },
  })
}
