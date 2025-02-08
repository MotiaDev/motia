import { BaseEdge as BaseReactFlowEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react'
import { cva } from 'class-variance-authority'
import React from 'react'
import { cn } from '@/lib/utils'

const labelVariants = cva('absolute pointer-events-all text-cs border p-1 px-2', {
  variants: {
    color: {
      default: 'border-[#b3b3b3] bg-black text-gray-100 font-semibold border-solid rounded-full',
      conditional: 'bg-amber-300 border-amber-950 text-amber-950 border-solid font-semibold italic rounded-lg',
    },
  },
  defaultVariants: {
    color: 'default',
  },
})

export const BaseEdge: React.FC<EdgeProps> = (props: EdgeProps) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props
  const label = data?.label as string | undefined
  const labelVariant = data?.labelVariant as 'default' | 'conditional' | null | undefined

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20,
    offset: 10,
  })

  return (
    <>
      <BaseReactFlowEdge
        path={edgePath}
        style={{
          stroke: data?.variant === 'virtual' ? 'rgb(147, 169, 197)' : 'rgb(133, 176, 132)',
          strokeWidth: 0.5,
          shapeRendering: 'geometricPrecision',
          fill: 'none',
          mixBlendMode: 'screen',
        }}
        className="edge-animated"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={cn(labelVariants({ color: labelVariant }))}
            style={{ transform: `translateX(-50%) translateY(-50%) translate(${labelX}px, ${labelY}px)` }}
          >
            <div className="text-xs font-mono">{label}</div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
