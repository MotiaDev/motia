import { FlowConfigResponse, FlowResponse } from '@/views/flow/hooks/use-get-flow-state'
import { useStreamItem } from '@motiadev/stream-client-react'

export const useFetchFlows = (flowId: string) => {
  const { data: flow } = useStreamItem<FlowResponse>({
    streamName: '__motia.flows',
    groupId: 'default',
    id: flowId,
  })
  const { data: flowConfig } = useStreamItem<FlowConfigResponse>({
    streamName: '__motia.flowsConfig',
    groupId: 'default',
    id: flowId,
  })
  return {
    flow,
    flowConfig,
  }
}
