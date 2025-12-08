import { type Edge, type Node, useNodesInitialized, useReactFlow } from '@xyflow/react'
import dagre from 'dagre'
import isEqual from 'fast-deep-equal'
import type React from 'react'
import { useEffect, useRef } from 'react'
import type { EdgeData, NodeData } from '../../types/flow'

const organizeNodes = (nodes: Node<NodeData>[], edges: Edge<EdgeData>[]): Node<NodeData>[] => {
  const dagreGraph = new dagre.graphlib.Graph({ directed: true, compound: false, multigraph: false })

  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 0, nodesep: 20, edgesep: 0 })

  nodes.forEach((node) => {
    if (node.position.x !== 0 || node.position.y !== 0) {
      dagreGraph.setNode(node.id, {
        width: node.measured?.width,
        height: node.measured?.height,
        x: node.position.x,
        y: node.position.y,
      })
    } else {
      dagreGraph.setNode(node.id, {
        width: node.measured?.width,
        height: node.measured?.height,
      })
    }
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
  nodes: Node<NodeData>[]
  edges: Edge<EdgeData>[]
}

export const NodeOrganizer: React.FC<Props> = ({ onInitialized, nodes, edges }) => {
  const { setNodes, getNodes, getEdges, fitView } = useReactFlow()
  const nodesInitialized = useNodesInitialized()
  const initialized = useRef(false)

  const lastNodesRef = useRef<Node<NodeData>[]>([])
  const lastEdgesRef = useRef<Edge<EdgeData>[]>([])

  useEffect(() => {
    if (nodesInitialized) {
      if (isEqual(lastNodesRef.current, nodes) && isEqual(lastEdgesRef.current, edges)) {
        return
      }

      lastNodesRef.current = nodes
      lastEdgesRef.current = edges

      try {
        const nodesToOrganize = nodes.some((node) => node.position.x === 0 && node.position.y === 0)

        if (nodesToOrganize) {
          const organizedNodes = organizeNodes(nodes, edges)
          setNodes(organizedNodes)
        }

        if (!initialized.current) {
          initialized.current = true
          onInitialized()
          setTimeout(() => fitView(), 1)
        }
      } catch (error) {
        console.error('Error organizing nodes:', error)
      }
    }
  }, [nodesInitialized, onInitialized, setNodes, getNodes, getEdges, fitView, nodes, edges])

  return null
}
