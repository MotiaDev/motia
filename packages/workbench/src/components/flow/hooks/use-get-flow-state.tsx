import { type Edge, type Node, useEdgesState, useNodesState } from '@xyflow/react'
import isEqual from 'fast-deep-equal'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EdgeData, FlowConfigResponse, FlowResponse, NodeConfig, NodeData } from '../../../types/flow'
import { ApiFlowNode } from '../nodes/api-flow-node'
import { CronFlowNode } from '../nodes/cron-flow-node'
import { EventFlowNode } from '../nodes/event-flow-node'
import { NoopFlowNode } from '../nodes/noop-flow-node'
import { useSaveWorkflowConfig } from './use-save-workflow-config'

const DEFAULT_CONFIG: NodeConfig = { x: 0, y: 0 }

const getNodePosition = (flowConfig: FlowConfigResponse | null, stepName: string): NodeConfig => {
  return flowConfig?.config[stepName] || DEFAULT_CONFIG
}

type FlowState = {
  nodes: Node<NodeData>[]
  edges: Edge<EdgeData>[]
  nodeTypes: Record<string, React.ComponentType<any>>
}

const nodeComponentCache = new Map<string, React.ComponentType<any>>()

const BASE_NODE_TYPES: Record<string, React.ComponentType<any>> = {
  event: EventFlowNode,
  api: ApiFlowNode,
  noop: NoopFlowNode,
  cron: CronFlowNode,
}

async function importFlow(flow: FlowResponse, flowConfig: FlowConfigResponse | null): Promise<FlowState> {
  const nodeTypes: Record<string, React.ComponentType<any>> = { ...BASE_NODE_TYPES }

  const customNodePromises = flow.steps
    .filter((step) => step.nodeComponentPath)
    .map(async (step) => {
      const path = step.nodeComponentPath!

      // Check cache first
      if (nodeComponentCache.has(path)) {
        nodeTypes[path] = nodeComponentCache.get(path)!
        return
      }

      try {
        const module = await import(/* @vite-ignore */ `/@fs/${path}`)
        const component = module.Node ?? module.default
        nodeComponentCache.set(path, component)
        nodeTypes[path] = component
      } catch (error) {
        console.error(`Failed to load custom node component: ${path}`, error)
      }
    })

  await Promise.all(customNodePromises)

  const nodes: Node<NodeData>[] = flow.steps.map((step) => ({
    id: step.id,
    type: step.nodeComponentPath || step.type,
    filePath: step.filePath,
    position: step.filePath ? getNodePosition(flowConfig, step.filePath) : DEFAULT_CONFIG,
    data: { ...step, nodeConfig: step.filePath ? getNodePosition(flowConfig, step.filePath) : DEFAULT_CONFIG },
    language: step.language,
  }))

  const edges: Edge<EdgeData>[] = flow.edges.map((edge) => ({
    ...edge,
    type: 'base',
  }))

  return { nodes, edges, nodeTypes }
}

export const useGetFlowState = (flow: FlowResponse, flowConfig: FlowConfigResponse) => {
  const [nodeTypes, setNodeTypes] = useState<Record<string, React.ComponentType<any>>>(BASE_NODE_TYPES)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<EdgeData>>([])

  const saveConfig = useSaveWorkflowConfig()

  const flowIdRef = useRef<string>('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const lastSavedConfigRef = useRef<FlowConfigResponse['config']>(null)
  const lastSavedFlowRef = useRef<FlowResponse>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedFlowConfig = useMemo(() => flowConfig, [flowConfig?.id, flowConfig?.config])

  useEffect(() => {
    if (!flow || flow.error) return
    const hasSameConfig = isEqual(lastSavedConfigRef.current, memoizedFlowConfig?.config)
    const hasSameFlow = isEqual(lastSavedFlowRef.current, flow)

    if (hasSameConfig && hasSameFlow) return

    lastSavedConfigRef.current = memoizedFlowConfig?.config
    flowIdRef.current = flow.id
    lastSavedFlowRef.current = flow

    const importFlowAsync = async () => {
      try {
        const { nodes, edges, nodeTypes } = await importFlow(flow, flowConfig)
        setNodes(nodes)
        setEdges(edges)
        setNodeTypes(nodeTypes)
      } catch (error) {
        console.error('Failed to import flow:', error)
      }
    }

    importFlowAsync()
  }, [flow, memoizedFlowConfig, setNodes, setEdges, flowConfig])

  const saveFlowConfig = useCallback(
    (nodesToSave: Node<NodeData>[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const steps = nodesToSave.reduce<FlowConfigResponse['config']>((acc, node) => {
          if (node.data.filePath) {
            acc[node.data.filePath] = {
              x: Math.round(node.position.x),
              y: Math.round(node.position.y),
            }

            if (node.data.nodeConfig?.sourceHandlePosition) {
              acc[node.data.filePath].sourceHandlePosition = node.data.nodeConfig.sourceHandlePosition
            }
            if (node.data.nodeConfig?.targetHandlePosition) {
              acc[node.data.filePath].targetHandlePosition = node.data.nodeConfig.targetHandlePosition
            }
          }
          return acc
        }, {})

        if (!isEqual(steps, lastSavedConfigRef.current)) {
          lastSavedConfigRef.current = steps
          const newConfig = { id: flowIdRef.current, config: steps }

          try {
            await saveConfig(newConfig)
          } catch (error) {
            console.error('Failed to save flow config:', error)
          }
        }
      }, 300)
    },
    [saveConfig],
  )

  useEffect(() => {
    if (nodes.length > 0) {
      saveFlowConfig(nodes)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [nodes, saveFlowConfig])

  return useMemo(
    () => ({ nodes, edges, onNodesChange, onEdgesChange, nodeTypes }),
    [nodes, edges, onNodesChange, onEdgesChange, nodeTypes],
  )
}
