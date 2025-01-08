import { Position } from '@xyflow/react'
import { NoopNodeData } from './nodes.types'
import { BaseHandle } from '../base-handle'

export const NoopNode = ({ data }: { data: NoopNodeData }) => {
  return (
    <div className="bg-lime-500 border-lime-950 border-solid border text-black rounded-[20px] p-2 px-4 text-black max-w-[300px]">
      <div className="flex flex-col gap-1 text-center">
        <div className="text-sm font-semibold">{data.name}</div>
        {data.description && <div className="text-xs">{data.description}</div>}
      </div>
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}
