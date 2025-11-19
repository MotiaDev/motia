import { memo, useMemo } from 'react'
import { useStreamRbacStore } from '../store'

export const EventLog = memo(() => {
  const { logEntries } = useStreamRbacStore()

  const logText = useMemo(
    () => (logEntries.length ? logEntries.join('\n') : 'Waiting for stream events…'),
    [logEntries],
  )

  return (
    <div
      className="p-4 rounded-xl bg-slate-900 border border-slate-800 h-[200px] overflow-auto font-mono text-sm whitespace-pre-line"
      role="log"
      aria-live="polite"
    >
      {logText}
    </div>
  )
})

EventLog.displayName = 'EventLog'
