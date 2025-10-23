import { Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import type { BaseNodeProps } from '../publicComponents/node-props'

export const useHandlePositions = (data: BaseNodeProps) => {
  const reactFlow = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const sourcePosition = data.nodeConfig?.sourceHandlePosition === 'bottom' ? Position.Bottom : Position.Right
  const targetPosition = data.nodeConfig?.targetHandlePosition === 'top' ? Position.Top : Position.Left

  const updateSourcePosition = (position: 'bottom' | 'right') => {
    reactFlow.updateNode(data.id, {
      data: { ...data, nodeConfig: { ...data.nodeConfig, sourceHandlePosition: position } },
    })
    updateNodeInternals(data.id)
  }

  const updateTargetPosition = (position: 'top' | 'left') => {
    reactFlow.updateNode(data.id, {
      data: { ...data, nodeConfig: { ...data.nodeConfig, targetHandlePosition: position } },
    })
    updateNodeInternals(data.id)
  }

  const toggleTargetPosition = () => {
    const newPosition = targetPosition === Position.Top ? Position.Left : Position.Top
    updateTargetPosition(newPosition)
  }

  const toggleSourcePosition = () => {
    const newPosition = sourcePosition === Position.Bottom ? Position.Right : Position.Bottom
    updateSourcePosition(newPosition)
  }

  return {
    sourcePosition,
    targetPosition,
    updateSourcePosition,
    updateTargetPosition,
    toggleTargetPosition,
    toggleSourcePosition,
  }
}
