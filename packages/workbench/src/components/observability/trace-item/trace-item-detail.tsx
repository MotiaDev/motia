import { Badge, Sidebar } from '@motiadev/ui'
import { X } from 'lucide-react'
import type React from 'react'
import { memo } from 'react'
import { formatDuration } from '@/lib/utils'
import type { Trace } from '@/types/observability'
import { EventIcon } from '../events/event-icon'
import { TraceEvent } from '../events/trace-event'

type Props = {
  trace: Trace
  onClose: () => void
}

export const TraceItemDetail: React.FC<Props> = memo(({ trace, onClose }) => {
  return (
    <Sidebar
      onClose={onClose}
      title="Trace Details"
      subtitle={`Viewing details from step ${trace.name}`}
      actions={[{ icon: <X />, onClick: onClose, label: 'Close' }]}
    >
      <div className="px-2 w-[800px] overflow-auto">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {trace.endTime && <span>Duration: {formatDuration(trace.endTime - trace.startTime)}</span>}
          <div className="bg-blue-500 font-bold text-xs px-[4px] py-[2px] rounded-sm text-blue-100">
            {trace.entryPoint.type}
          </div>
          {trace.correlationId && <Badge variant="outline">Correlated: {trace.correlationId}</Badge>}
        </div>
        <div className="pl-6 border-l-1 border-gray-500/40 font-mono text-xs flex flex-col gap-3">
          {trace.events.map((event, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-[26px] top-[8px] w-1 h-1 rounded-full bg-emerald-500 outline outline-2 outline-emerald-500/50"></div>

              <div className="flex items-center gap-2">
                <EventIcon event={event} />
                <span className="text-sm font-mono text-muted-foreground">
                  +{formatDuration(Math.floor(event.timestamp - trace.startTime))}
                </span>
                <TraceEvent event={event} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {trace.error && (
        <div className="p-4 bg-red-800/10">
          <div className="text-sm text-red-800 dark:text-red-400 font-semibold">{trace.error.message}</div>
          <div className="text-sm text-red-800 dark:text-red-400 pl-4">{trace.error.stack}</div>
        </div>
      )}
    </Sidebar>
  )
})
