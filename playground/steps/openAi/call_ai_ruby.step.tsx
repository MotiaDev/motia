import React from 'react'
import { BaseHandle, EventNodeProps, Position } from '@motiadev/workbench'

export const Node: React.FC<EventNodeProps> = () => {
  return (
    <div className="p-3 px-6 flex flex-col max-w-[300px] bg-red-500 border-white rounded-full text-white border border-solid text-center text-sm">
      <div>Calling OpenAI</div>
      <div>from Ruby</div>
      <BaseHandle type="target" position={Position.Top} />
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  )
}
