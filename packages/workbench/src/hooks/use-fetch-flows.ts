import { useStreamGroup } from '@motiadev/stream-client-react'
import { useEffect } from 'react'
import { useFlowStore } from '@/stores/use-flow-store'
import type { FlowResponse } from '@/types/flow'

const streamGroupArgs = { streamName: '__motia.flows', groupId: 'default' }

export const useFetchFlows = () => {
  const setFlows = useFlowStore((state) => state.setFlows)
  const selectFlowId = useFlowStore((state) => state.selectFlowId)
  const selectedFlowId = useFlowStore((state) => state.selectedFlowId)

  const { data: flows } = useStreamGroup<FlowResponse>(streamGroupArgs)

  useEffect(() => {
    if (flows) setFlows(flows.map((flow) => flow.id))
  }, [flows, setFlows])

  useEffect(() => {
    if (
      (!selectedFlowId && flows.length > 0) ||
      (selectedFlowId && flows.length > 0 && !flows.find((flow) => flow.id === selectedFlowId))
    ) {
      selectFlowId(flows[0].id)
    }
  }, [flows, selectedFlowId, selectFlowId])
}
