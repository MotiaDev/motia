import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { formatTimestamp } from '@/lib/utils'
import { useGlobalStore } from '@/stores/use-global-store'
import { useLogsStore } from '@/stores/use-logs-store'
import { Button, cn, Input } from '@motiadev/ui'
import { Search, Trash, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LogDetail } from './log-detail'
import { LogLevelDot } from './log-level-dot'

export const LogsPage = () => {
  const logs = useLogsStore((state) => state.logs)
  const resetLogs = useLogsStore((state) => state.resetLogs)
  const selectedLogId = useGlobalStore((state) => state.selectedLogId)
  const selectLogId = useGlobalStore((state) => state.selectLogId)
  const selectedLog = useMemo(
    () => (selectedLogId ? logs.find((log) => log.id === selectedLogId) : undefined),
    [logs, selectedLogId],
  )

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
    <>
      <div className="grid grid-rows-[auto_1fr] h-full">
        <div className="flex p-2 border-b gap-2" data-testid="logs-search-container">
          <div className="flex-1 relative">
            <Input
              variant="shade"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-9 font-medium"
              placeholder="Search"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <X
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => setSearch('')}
            />
          </div>
          <Button variant="default" onClick={resetLogs} className="h-[34px]">
            <Trash /> Clear
          </Button>
        </div>
        <Table>
          <TableBody className="font-mono font-medium">
            {filteredLogs.map((log, index) => (
              <TableRow
                data-testid="log-row"
                className={cn('font-mono font-semibold cursor-pointer border-0', {
                  'bg-muted-foreground/10 hover:bg-muted-foreground/20': selectedLogId === log.id,
                  'hover:bg-muted-foreground/10': selectedLogId !== log.id,
                })}
                key={index}
                onClick={() => selectLogId(log.id)}
              >
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
    </>
  )
}
