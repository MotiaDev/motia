import { useGlobalStore } from '@/stores/use-global-store'
import { Trace, TraceGroup } from '@/types/observability'
import { useStreamGroup, useStreamItem } from '@motiadev/stream-client-react'
import { Button } from '@motiadev/ui'
import { Minus, Plus } from 'lucide-react'
import React, { memo, useMemo, useState } from 'react'
import { useGetEndTime } from './hooks/use-get-endtime'
import { TraceItem } from './trace-item/trace-item'
import { TraceItemDetail } from './trace-item/trace-item-detail'

type Props = {
  groupId: string
}

export const TraceTimeline: React.FC<Props> = memo(({ groupId }) => {
  const { data: group } = useStreamItem<TraceGroup>({
    streamName: 'motia-trace-group',
    groupId: 'default',
    id: groupId,
  })
  const { data } = useStreamGroup<Trace>({ streamName: 'motia-trace', groupId })
  const endTime = useGetEndTime(group)
  const [zoom, setZoom] = useState(1)
  const selectedTraceId = useGlobalStore((state) => state.selectedTraceId)
  const selectTraceId = useGlobalStore((state) => state.selectTraceId)

  const selectedTrace = useMemo(() => data?.find((trace) => trace.id === selectedTraceId), [data, selectedTraceId])

  const zoomMinus = () => {
    if (zoom > 0.5) setZoom(zoom - 0.1)
  }

  if (!group) return null

  return (
    <>
      <div className="flex flex-col flex-1 overflow-x-auto h-full relative">
        <div className="flex flex-col items-center min-w-full sticky top-0" style={{ width: `${zoom * 1000}px` }}>
          <div className="flex flex-1 w-full sticky top-0 bg-background z-10">
            <div className="w-full min-h-[37px] h-[37px] min-w-[200px] max-w-[200px] flex items-center justify-center gap-2 sticky left-0 top-0 dark:bg-[#121212] bg-[#f1f1f1]">
              <Button variant="icon" size="sm" className="px-2" onClick={zoomMinus}>
                <Minus className="w-4 h-4 cursor-pointer" />
              </Button>
              <span className="text-sm font-bold text-muted-foreground">{Math.floor(zoom * 100)}%</span>
              <Button variant="icon" size="sm" className="px-2" onClick={() => setZoom(zoom + 0.1)}>
                <Plus className="w-4 h-4 cursor-pointer" />
              </Button>
            </div>
            <div className="flex justify-between font-mono p-2 w-full text-xs text-muted-foreground dark:bg-[#131313] bg-[#f1f1f1]">
              <span>0ms</span>
              <span>{Math.floor((endTime - group.startTime) * 0.25)}ms</span>
              <span>{Math.floor((endTime - group.startTime) * 0.5)}ms</span>
              <span>{Math.floor((endTime - group.startTime) * 0.75)}ms</span>
              <span>{Math.floor(endTime - group.startTime)}ms</span>
              <div className="absolute bottom-[-4px] w-full flex justify-between">
                <span className="w-[1px] h-full bg-blue-500"></span>
                <span className="w-[1px] h-full bg-blue-500"></span>
                <span className="w-[1px] h-full bg-blue-500"></span>
                <span className="w-[1px] h-full bg-blue-500"></span>
                <span className="w-[1px] h-full bg-blue-500"></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full h-full">
            {data?.map((trace) => (
              <TraceItem key={trace.id} trace={trace} group={group} groupEndTime={endTime} onExpand={selectTraceId} />
            ))}
          </div>
        </div>
      </div>
      {selectedTrace && <TraceItemDetail trace={selectedTrace} onClose={() => selectTraceId(undefined)} />}
    </>
  )
})
