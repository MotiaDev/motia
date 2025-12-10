import { useStreamGroup } from '@motiadev/stream-client-react'
import { useObservabilityStore } from '../stores/use-observability-store'
import type { Trace } from '../types/observability'

const streamName = 'motia-trace'

export const useTracesStream = () => {
  const groupId = useObservabilityStore((state) => state.selectedTraceGroupId)
  const setData = useObservabilityStore((state) => state.setTraces)

  useStreamGroup<Trace>({
    streamName,
    groupId,
    setData,
  })
}
