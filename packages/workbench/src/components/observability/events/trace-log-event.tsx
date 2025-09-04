import type React from 'react'
import { LogLevelDot } from '@/components/logs/log-level-dot'
import type { LogEntry } from '@/types/observability'

export const TraceLogEvent: React.FC<{ event: LogEntry }> = ({ event }) => {
  return (
    <div className="flex items-center gap-2">
      <LogLevelDot level={event.level} /> {event.message}
    </div>
  )
}
