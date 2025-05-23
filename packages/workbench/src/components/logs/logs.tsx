import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Log, useLogs } from '@/stores/use-logs'
import { useState } from 'react'
import { LogDetail } from './log-detail'
import { LogLevelDot } from './log-level-dot'

const timestamp = (time: number) => {
  const date = new Date(Number(time))
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

export const Logs = () => {
  const logs = useLogs((state) => state.logs)
  const [selectedLog, setSelectedLog] = useState<Log>()

  const handleLogClick = (log: Log) => {
    setSelectedLog(log)
  }

  return (
    <div className="overflow-y-auto h-full text-bold p-4">
      <LogDetail log={selectedLog} onClose={() => setSelectedLog(undefined)} />
      <Table>
        <TableBody className="text-md font-mono">
          {logs.map((log, index) => (
            <TableRow
              key={index}
              className="cursor-pointer even:bg-muted/50 border-0"
              onClick={() => handleLogClick(log)}
            >
              <TableCell className="whitespace-nowrap flex items-center gap-2">
                <LogLevelDot level={log.level} />
                {timestamp(log.time)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-md cursor-pointer hover:text-primary text-muted-foreground text-xs font-mono">
                {log.traceId}
              </TableCell>
              <TableCell className="whitespace-nowrap text-md font-mono">{log.step}</TableCell>
              <TableCell className="whitespace-nowrap text-md font-mono max-w-[500px] truncate w-full">
                {log.msg}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
