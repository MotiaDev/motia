import React from 'react'
import { LogEntry } from '@/types/observability'
import { LogLevelBadge } from '@/components/logs/log-level-badge'

export const TraceLogEvent: React.FC<{ event: LogEntry }> = ({ event }) => {
  return (
    <div className="flex items-center gap-2">
      <LogLevelBadge level={event.level} /> {event.message}
    </div>
  )
}
