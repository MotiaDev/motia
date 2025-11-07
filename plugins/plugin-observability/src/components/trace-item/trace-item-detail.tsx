import { Badge, Sidebar } from '@motiadev/ui'
import { X } from 'lucide-react'
import type React from 'react'
import { Fragment, memo } from 'react'
import { formatDuration } from '../../lib/utils'
import type { Trace } from '../../types/observability'
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
      initialWidth={600}
      title="Trace Details"
      subtitle={`Viewing details from step ${trace.name}`}
      actions={[{ icon: <X />, onClick: onClose, label: 'Close' }]}
    >
      <div className="px-2 overflow-auto">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {trace.endTime && <span>Duration: {formatDuration(trace.endTime - trace.startTime)}</span>}
          <div className="bg-blue-500 font-bold text-xs px-[4px] py-[2px] rounded-sm text-blue-100">
            {trace.entryPoint.type}
          </div>
          {trace.correlationId && <Badge variant="outline">Correlated: {trace.correlationId}</Badge>}
        </div>
        <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-2 gap-y-3 font-mono text-xs border-l-1 border-gray-500/40 pl-6">
          {trace.events.map((event, index) => (
            <Fragment key={index}>
              <div className="grid place-items-center">
                <div className="w-1 h-1 rounded-full bg-emerald-500 outline outline-2 outline-emerald-500/50 -ml-[26px]"></div>
              </div>
              <div className="grid place-items-center">
                <EventIcon event={event} />
              </div>
              <div className="grid place-items-center">
                <span className="text-sm font-mono text-muted-foreground">
                  +{formatDuration(Math.floor(event.timestamp - trace.startTime))}
                </span>
              </div>
              <div className="grid place-items-start">
                <TraceEvent event={event} />
              </div>
            </Fragment>
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
