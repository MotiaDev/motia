import { EdgeData, FlowConfigResponse, FlowResponse, NodeData } from '@/types/flow'
import {
  Background,
  BackgroundVariant,
  NodeChange,
  OnNodesChange,
  ReactFlow,
  Edge as ReactFlowEdge,
  Node as ReactFlowNode,
} from '@xyflow/react'
import React, { useCallback, useState } from 'react'
import { BaseEdge } from './base-edge'
import { FlowLoader } from './flow-loader'
import { useGetFlowState } from './hooks/use-get-flow-state'
import { NodeOrganizer } from './node-organizer'

import '@xyflow/react/dist/style.css'

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
      >
        <Background variant={BackgroundVariant.Dots} gap={50} size={2} className="bg-canvas-background!" />
        <NodeOrganizer onInitialized={onInitialized} nodes={nodes} edges={edges} />
      </ReactFlow>
    </div>
  )
}
