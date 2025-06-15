import React from 'react'
import { Trace, TraceGroup } from '@/types/observability'
import { useStreamGroup, useStreamItem } from '@motiadev/stream-client-react'
import { TraceItem } from './trace-item/trace-item'

type Props = {
  groupId: string
}

export const TraceTimeline: React.FC<Props> = ({ groupId }) => {
  const { data: group } = useStreamItem<TraceGroup>({
    streamName: 'motia-trace-group',
    groupId: 'default',
    id: groupId,
  })
  const { data } = useStreamGroup<Trace>({ streamName: 'motia-trace', groupId })

  if (!group) return null

  const endTime = group.endTime || Date.now()

  return (
    <div className="flex flex-col p-2">
      <div className="flex flex-row items-center px-2">
        <div className="flex items-center min-w-[200px] w-[200px] h-[20px]"></div>
        <div className="flex flex-1 relative">
          <div className="flex justify-between font-mono pb-2 w-full text-xs text-muted-foreground border-b border-blue-500">
            <span>0ms</span>
            <span>{Math.floor((endTime - group.startTime) * 0.25)}ms</span>
            <span>{Math.floor((endTime - group.startTime) * 0.5)}ms</span>
            <span>{Math.floor((endTime - group.startTime) * 0.75)}ms</span>
            <span>{Math.floor(endTime - group.startTime)}ms</span>
            <div className="absolute bottom-[-4px] w-full flex justify-between">
              <span className="w-[1px] h-2 bg-blue-500"></span>
              <span className="w-[1px] h-2 bg-blue-500"></span>
              <span className="w-[1px] h-2 bg-blue-500"></span>
              <span className="w-[1px] h-2 bg-blue-500"></span>
              <span className="w-[1px] h-2 bg-blue-500"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-full overflow-auto p-2 space-y-2">
        {data?.map((trace) => <TraceItem key={trace.id} trace={trace} group={group} />)}
      </div>
    </div>
  )
}
