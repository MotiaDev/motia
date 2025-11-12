import { useStreamItem } from '@motiadev/stream-client-react'
import { ReactFlowProvider } from '@xyflow/react'
import { memo, useMemo } from 'react'
import { useFlowStore } from '@/stores/use-flow-store'
import type { FlowConfigResponse, FlowResponse } from '@/types/flow'
import { FlowView } from './flow-view'

export const FlowPage = memo(() => {
  const selectedFlowId = useFlowStore((state) => state.selectedFlowId)
  const streamItemArgs = useMemo(
    () => ({ streamName: '__motia.flows', groupId: 'default', id: selectedFlowId ?? '' }),
    [selectedFlowId],
  )
  const { data: flow } = useStreamItem<FlowResponse>(streamItemArgs)

  const streamItemArgsConfig = useMemo(
    () => ({ streamName: '__motia.flowsConfig', groupId: 'default', id: selectedFlowId ?? '' }),
    [selectedFlowId],
  )
  const { data: flowConfig } = useStreamItem<FlowConfigResponse>(streamItemArgsConfig)

  if (!flow || flow.error)
    return (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center">
        <p>{flow?.error}</p>
      </div>
    )

  return (
    <ReactFlowProvider>
      <FlowView flow={flow} flowConfig={flowConfig!} />
    </ReactFlowProvider>
  )
})
FlowPage.displayName = 'FlowPage'
