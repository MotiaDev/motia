import {
  Background,
  BackgroundVariant,
  type NodeChange,
  type OnNodesChange,
  ReactFlow,
  type Edge as ReactFlowEdge,
  type Node as ReactFlowNode,
} from '@xyflow/react'
import type React from 'react'
import { useCallback, useState } from 'react'
import type { EdgeData, FlowConfigResponse, FlowResponse, NodeData } from '../../types/flow'
import { BaseEdge } from './base-edge'
import { FlowLoader } from './flow-loader'
import { useGetFlowState } from './hooks/use-get-flow-state'
import { NodeOrganizer } from './node-organizer'

import '@xyflow/react/dist/style.css'
import { BackgroundEffect } from '@motiadev/ui'

export type FlowNode = ReactFlowNode<NodeData>
export type FlowEdge = ReactFlowEdge<EdgeData>

const edgeTypes = {
  base: BaseEdge,
}

type Props = {
  flow: FlowResponse
  flowConfig: FlowConfigResponse
}

export const FlowView: React.FC<Props> = ({ flow, flowConfig }) => {
  const { nodes, edges, onNodesChange, onEdgesChange, nodeTypes } = useGetFlowState(flow, flowConfig)
  const [initialized, setInitialized] = useState(false)
  const onInitialized = useCallback(() => setInitialized(true), [])

  const onNodesChangeHandler = useCallback<OnNodesChange<FlowNode>>(
    (changes: NodeChange<FlowNode>[]) => onNodesChange(changes),
    [onNodesChange],
  )

  if (!nodeTypes) {
    return null
  }

  return (
    <div className="w-full h-full relative">
      {!initialized && <FlowLoader />}
      <ReactFlow
        minZoom={0.1}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
        className="isolate"
      >
        <BackgroundEffect />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <NodeOrganizer onInitialized={onInitialized} nodes={nodes} edges={edges} />
      </ReactFlow>
    </div>
  )
}
