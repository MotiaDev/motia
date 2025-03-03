// packages/workbench/src/views/flow/flow-view.tsx

import { LogConsole } from '@/components/logs/log-console'
import { Background, BackgroundVariant, NodeChange, OnNodesChange, ReactFlow, useReactFlow } from '@xyflow/react'
import React, { useCallback, useEffect, useState } from 'react'
import { ArrowHead } from './arrow-head'
import { BaseEdge } from './base-edge'
import { FlowLoader } from './flow-loader'
import { EdgeData, NodeData } from './nodes/nodes.types'
import { FlowConfigResponse, FlowResponse, useGetFlowState } from './hooks/use-get-flow-state'
import { Legend } from './legend'
import { useSaveWorkflowConfig, NodePosition } from './hooks/use-save-workflow-config'
import { NodeOrganizer } from './node-organizer'
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react'
import { useDebounced } from '@/hooks/use-debounced'

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
  const { getNodes } = useReactFlow<FlowNode, FlowEdge>()
  const { saveConfig } = useSaveWorkflowConfig(flow.id)
  const [hoveredType, setHoveredType] = useState<string | null>(null)

  useEffect(() => setInitialized(false), [flow])
  const onInitialized = useCallback(() => {
    setTimeout(() => setInitialized(true), 10)
  }, [])

  const getClassName = (nodeType?: string) => {
    if (!hoveredType) return ''

    if (nodeType) {
      return nodeType === hoveredType
        ? 'shadow-[0_0_15px_rgba(255,255,255,0.15)] border border-white/30 scale-[1.02] transition-all duration-300'
        : 'opacity-30 transition-all duration-300'
    }

    // If no nodeType is provided, this is an edge
    return 'opacity-30 transition-all duration-300'
  }

  const nodesWithHighlights = nodes.map((node) => ({
    ...node,
    className: getClassName(node.data.type),
  }))

  const edgesWithHighlights = edges.map((edge) => ({
    ...edge,
    className: getClassName(), // No argument means it's an edge
  }))

  const saveFlowConfig = useCallback(() => {
    const steps = getNodes().reduce((acc, node) => {
      if (node.data.filePath) {
        acc[node.data.filePath] = node.position
      }
      return acc
    }, {} as NodePosition)
    return saveConfig(steps)
  }, [saveConfig, getNodes])

  const debouncedSaveConfig = useDebounced(saveFlowConfig)

  const onNodesChangeHandler = useCallback<OnNodesChange<FlowNode>>(
    (changes: NodeChange<FlowNode>[]) => {
      onNodesChange(changes)
      debouncedSaveConfig()
    },
    [onNodesChange, debouncedSaveConfig],
  )

  if (!nodeTypes) {
    return null
  }

  return (
    <div className="w-full h-full relative bg-black">
      {!initialized && <FlowLoader />}
      <Legend onHover={setHoveredType} />
      <ReactFlow
        nodes={nodesWithHighlights}
        edges={edgesWithHighlights}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#99a" bgColor="#1d1c2a" />
        <NodeOrganizer onInitialized={onInitialized} />
        <svg>
          <defs>
            <ArrowHead color="#B3B3B3" id="arrowhead" />
          </defs>
        </svg>
      </ReactFlow>
      <LogConsole />
    </div>
  )
}
