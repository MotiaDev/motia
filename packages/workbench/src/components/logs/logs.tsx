import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { formatTimestamp } from '@/lib/utils'
import { useGlobalStore } from '@/stores/use-global-store'
import { useLogsStore } from '@/stores/use-logs-store'
import { useMemo, useState } from 'react'
import { LogDetail } from './log-detail'
import { LogLevelDot } from './log-level-dot'
import { Button, Input } from '@motiadev/ui'
import { CircleX, Trash } from 'lucide-react'

export const Logs = () => {
  const logs = useLogsStore((state) => state.logs)
  const resetLogs = useLogsStore((state) => state.resetLogs)
  const selectedLogId = useGlobalStore((state) => state.selectedLogId)
  const selectLogId = useGlobalStore((state) => state.selectLogId)
  const selectedLog = useMemo(() => {
    return selectedLogId ? logs.find((log) => log.id === selectedLogId) : undefined
  }, [logs, selectedLogId])

  const [search, setSearch] = useState('')
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      return (
        log.msg.toLowerCase().includes(search.toLowerCase()) ||
        log.traceId.toLowerCase().includes(search.toLowerCase()) ||
        log.step.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [logs, search])

  return (
    <div className="h-full flex flex-row">
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <div className="flex p-2 border-b gap-4">
          <div className="flex-1 relative">
            <Input
              variant="shade"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 font-medium"
            />
            <CircleX
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => setSearch('')}
            />
          </div>
          <Button variant="outline" onClick={resetLogs}>
            <Trash /> Clear
          </Button>
        </div>
        <Table>
          <TableBody className="font-mono font-medium">
            {filteredLogs.map((log, index) => (
              <TableRow key={index} className="cursor-pointer border-0" onClick={() => selectLogId(log.id)}>
                <TableCell
                  data-testid={`time-${index}`}
                  className="whitespace-nowrap flex items-center gap-2 text-muted-foreground"
                >
                  <LogLevelDot level={log.level} />
                  {formatTimestamp(log.time)}
                </TableCell>
                <TableCell
                  data-testid={`trace-${log.traceId}`}
                  className="whitespace-nowrap cursor-pointer hover:text-primary text-muted-foreground"
                  onClick={() => setSearch(log.traceId)}
                >
                  {log.traceId}
                </TableCell>
                <TableCell data-testid={`step-${index}`} aria-label={log.step} className="whitespace-nowrap">
                  {log.step}
                </TableCell>
                <TableCell
                  data-testid={`msg-${index}`}
                  aria-label={log.msg}
                  className="whitespace-nowrap max-w-[500px] truncate w-full"
                >
                  {log.msg}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LogDetail log={selectedLog} onClose={() => selectLogId(undefined)} />
    </div>
  )
}
