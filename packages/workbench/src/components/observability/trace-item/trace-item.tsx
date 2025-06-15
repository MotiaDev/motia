import { Trace, TraceGroup } from '@/types/observability'
import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'
import { cn } from '../../../lib/utils'
import { Badge } from '../../ui/badge'
import { Card, CardContent } from '../../ui/card'
import { EventIcon } from '../events/event-icon'
import { TraceEvent } from '../events/trace-event'

const formatDuration = (duration?: number) => {
  if (!duration) return 'N/A'
  if (duration < 1000) return `${duration}ms`
  return `${(duration / 1000).toFixed(1)}s`
}

export const TraceItem: React.FC<{ trace: Trace; group: TraceGroup }> = ({ trace, group }) => {
  const groupStartDate = group.startTime
  const traceStartTime = trace.startTime
  const traceEndTime = trace.endTime
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <div
        className="flex flex-row items-center hover:bg-muted/50 p-1 rounded-md cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center min-w-[200px] w-[200px] h-[20px]">
          <ChevronDown
            className={cn('w-[20px] h-4 mr-2 transition-transform duration-200', {
              'rotate-180': isExpanded,
            })}
          />
          <h2 className="text-sm font-medium text-muted-foreground">{trace.name}</h2>
        </div>
        <div
          className={cn('h-[20px] rounded-[4px] cursor-pointer hover:opacity-80', {
            'bg-blue-500': trace.status === 'running',
            'bg-green-500': trace.status === 'completed',
            'bg-red-500': trace.status === 'failed',
          })}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            marginLeft: group.endTime
              ? `${((traceStartTime - groupStartDate) / (group.endTime - groupStartDate)) * 100}%`
              : '0%',
            width: group.endTime
              ? traceEndTime
                ? `${((traceEndTime - traceStartTime) / (group.endTime - groupStartDate)) * 100}%`
                : `${((Date.now() - traceStartTime) / (group.endTime - groupStartDate)) * 100}%`
              : '100%',
          }}
        ></div>
      </div>
      {isExpanded && (
        <Card className="mt-2">
          <CardContent className="p-4">
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
                      +{Math.floor(event.timestamp - trace.startTime)}ms
                    </span>
                    <TraceEvent event={event} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
