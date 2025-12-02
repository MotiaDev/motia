import { useStreamGroup } from '@motiadev/stream-client-react'
import { Button } from '@motiadev/ui'
import { Minus, Plus } from 'lucide-react'
import type React from 'react'
import { memo, useMemo, useState } from 'react'
import { useGetEndTime } from '../hooks/use-get-endtime'
import { formatDuration } from '../lib/utils'
import { useObservabilityStore } from '../stores/use-observability-store'
import type { Trace, TraceGroup } from '../types/observability'
import { TraceItem } from './trace-item/trace-item'
import { TraceItemDetail } from './trace-item/trace-item-detail'

export const TraceTimeline: React.FC = memo(() => {
  const groupId = useObservabilityStore((state) => state.selectedTraceGroupId)
  if (!groupId) return null
  return <TraceTimelineComponent groupId={groupId} />
})
TraceTimeline.displayName = 'TraceTimeline'

interface TraceTimelineComponentProps {
  groupId: string
}
const TraceTimelineComponent: React.FC<TraceTimelineComponentProps> = memo(({ groupId }) => {
  const traceGroupStreamArgs = useMemo(() => ({ streamName: 'motia-trace-group', groupId: 'default' }), [])
  const { data: traceGroups } = useStreamGroup<TraceGroup>(traceGroupStreamArgs)
  const group = useMemo(() => traceGroups.find((traceGroup) => traceGroup.id === groupId), [traceGroups, groupId])

  const streamGroupArgs = useMemo(() => ({ streamName: 'motia-trace', groupId }), [groupId])
  const { data } = useStreamGroup<Trace>(streamGroupArgs)

  const endTime = useGetEndTime(group)
  const [zoom, setZoom] = useState(100)
  const selectedTraceId = useObservabilityStore((state) => state.selectedTraceId)
  const selectTraceId = useObservabilityStore((state) => state.selectTraceId)

  const selectedTrace = useMemo(() => data?.find((trace) => trace.id === selectedTraceId), [data, selectedTraceId])

  const zoomMinus = () => zoom > 100 && setZoom((prevZoom) => prevZoom - 10)
  const zoomPlus = () => zoom < 200 && setZoom((prevZoom) => prevZoom + 10)

  if (!group) return null

  return (
    <>
      <div className="flex flex-col flex-1 relative min-h-full min-w-[1000px]">
        <div className="flex flex-col" style={{ width: `${zoom}%` }}>
          <div className="flex flex-1 bg-background" style={{ width: `${zoom}%` }}>
            <div className="shrink-0 w-[200px] h-[37px] flex items-center justify-center gap-2 sticky left-0 top-0 z-10 bg-card backdrop-blur-xs backdrop-filter">
              <Button variant="icon" size="sm" className="px-2" onClick={zoomMinus} disabled={zoom <= 100}>
                <Minus className="w-4 h-4 cursor-pointer" />
              </Button>
              <span className="min-w-12 text-center select-none text-sm font-bold text-muted-foreground">{zoom}%</span>
              <Button variant="icon" size="sm" className="px-2" onClick={zoomPlus} disabled={zoom >= 200}>
                <Plus className="w-4 h-4 cursor-pointer" />
              </Button>
            </div>
            <div className="flex justify-between font-mono p-2 w-full text-xs text-muted-foreground bg-card">
              <span>0ms</span>
              <span>{formatDuration(Math.floor((endTime - group.startTime) * 0.25))}</span>
              <span>{formatDuration(Math.floor((endTime - group.startTime) * 0.5))}</span>
              <span>{formatDuration(Math.floor((endTime - group.startTime) * 0.75))}</span>
              <span>{formatDuration(Math.floor(endTime - group.startTime))}</span>
            </div>
          </div>

          <div className="flex flex-col h-full" style={{ width: `${zoom}%` }}>
            {data?.map((trace) => (
              <TraceItem
                key={trace.id}
                traceId={trace.id}
                traceName={trace.name}
                traceStatus={trace.status}
                traceStartTime={trace.startTime}
                traceEndTime={trace.endTime}
                groupStartTime={group.startTime}
                groupEndTime={endTime}
                onExpand={selectTraceId}
              />
            ))}
          </div>
        </div>
      </div>
      {selectedTrace && <TraceItemDetail trace={selectedTrace} onClose={() => selectTraceId(undefined)} />}
    </>
  )
})
TraceTimelineComponent.displayName = 'TraceTimelineComponent'
