import { LogLevelDot } from '@/components/logs/log-level-dot'
import { LogEntry } from '@/types/observability'
import React from 'react'

export const TraceLogEvent: React.FC<{ event: LogEntry }> = ({ event }) => {
  return (
    <div className="flex items-center gap-2">
      <LogLevelDot level={event.level} /> {event.message}
    </div>
  )
}
