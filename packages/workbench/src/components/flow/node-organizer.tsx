import { Edge, Node, useNodesInitialized, useReactFlow } from '@xyflow/react'
import React, { useEffect, useRef } from 'react'
import { ApiNodeData, EdgeData, EventNodeData } from '@/types/flow'
import dagre from 'dagre'

const organizeNodes = (
  nodes: Node<EventNodeData | ApiNodeData>[],
  edges: Edge<EdgeData>[],
): Node<EventNodeData | ApiNodeData>[] => {
  const dagreGraph = new dagre.graphlib.Graph({ compound: true })
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 60, edgesep: 20, ranker: 'tight-tree' })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.measured?.width, height: node.measured?.height })
  })

  edges.forEach((edge) => {
    if (typeof edge.label === 'string') {
      dagreGraph.setEdge(edge.source, edge.target, {
        label: edge.label ?? '',
        width: edge.label.length * 40, // Add width for the label
        height: 30, // Add height for the label
        labelpos: 'c', // Position label in center
      })
    } else {
      dagreGraph.setEdge(edge.source, edge.target)
    }
  })

  dagre.layout(dagreGraph)

  return nodes.map((node) => {
    if (node.position.x !== 0 || node.position.y !== 0) {
      return node
    }

    const { x, y } = dagreGraph.node(node.id)
    const position = {
      x: x - (node.measured?.width ?? 0) / 2,
      y: y - (node.measured?.height ?? 0) / 2,
    }

    return { ...node, position }
  })
}

type Props = {
  onInitialized: () => void
}

export const NodeOrganizer: React.FC<Props> = ({ onInitialized }) => {
  const { setNodes, getNodes, getEdges, fitView } = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const initialized = useRef(false)

  useEffect(() => {
    if (nodesInitialized && !initialized.current) {
      initialized.current = true

      const nodes = getNodes() as Node<EventNodeData | ApiNodeData>[]
      const edges = getEdges() as Edge<EdgeData>[]
      const organizedNodes = organizeNodes(nodes, edges)

      setNodes(organizedNodes)
      onInitialized()
      setTimeout(() => fitView(), 1)
    }
  }, [nodesInitialized, onInitialized, setNodes, getNodes, getEdges, fitView])

  return null
}
