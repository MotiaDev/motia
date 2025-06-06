import { useStreamGroup } from '@motiadev/stream-client-react'
import { FlowResponse } from '@/views/flow/hooks/use-get-flow-state'

export type Flow = {
  id: string
  name: string
  data?: FlowResponse
}

export const useListFlows = () => {
  const { data: flows } = useStreamGroup<Flow>({
    streamName: '__motia.flows',
    groupId: 'default',
  })

  return { flows }
}
