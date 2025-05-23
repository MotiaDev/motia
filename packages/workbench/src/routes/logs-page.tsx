import { Logs } from '../components/logs/logs'
import { useLogs } from '../stores/use-logs'
import { useEffect } from 'react'

export const LogsPage = () => {
  const setUnreadLogsCount = useLogs((state) => state.setUnreadLogsCount)

  useEffect(() => {
    setUnreadLogsCount(0)
    return () => setUnreadLogsCount(0)
  }, [setUnreadLogsCount])

  return (
    <div className="w-full h-screen overflow-hidden bg-background text-foreground">
      <header className="p-4 pb-0 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Logs</h1>
        <span className="text-sm text-muted-foreground">Check all logs saved locally</span>
      </header>
      <Logs />
    </div>
  )
}
