import { useStreamGroup } from '@motiadev/stream-client-react'
import { useEffect } from 'react'
import { useFlowStore } from '../stores/use-flow-store'
import type { FlowResponse } from '../types/flow'

const streamGroupArgs = { streamName: '__motia.flows', groupId: 'default' }

export const useFetchFlows = () => {
  const setFlows = useFlowStore((state) => state.setFlows)
  const selectFlowId = useFlowStore((state) => state.selectFlowId)
  const clearSelectedFlowId = useFlowStore((state) => state.clearSelectedFlowId)
  const selectedFlowId = useFlowStore((state) => state.selectedFlowId)

  const { data: flows } = useStreamGroup<FlowResponse>(streamGroupArgs)

  useEffect(() => {
    if (flows) setFlows(flows.map((flow) => flow.id))
  }, [flows, setFlows])

  useEffect(() => {
    const hasFlows = flows.length > 0
    const isSelectedFlowValid = selectedFlowId && flows.some((flow) => flow.id === selectedFlowId)

    if (!hasFlows && selectedFlowId) {
      clearSelectedFlowId()
      return
    }

    if (hasFlows && (!selectedFlowId || !isSelectedFlowValid)) {
      selectFlowId(flows[0].id)
    }
  }, [flows, selectedFlowId, selectFlowId, clearSelectedFlowId])
}
