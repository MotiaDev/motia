import { Button, cn, Input, LevelDot } from '@motiadev/ui'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Trash, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useLogsStream } from '../hooks/use-logs-stream'
import { useLogsStore } from '../stores/use-logs-store'
import { formatTimestamp } from '../utils/format-timestamp'
import { LogDetail } from './log-detail'

const ROW_HEIGHT = 40

export const LogsPage = () => {
  useLogsStream()

  const logs = useLogsStore((state) => state.logs)
  const resetLogs = useLogsStore((state) => state.resetLogs)
  const selectedLogId = useLogsStore((state) => state.selectedLogId)
  const selectLogId = useLogsStore((state) => state.selectLogId)
  const selectedLog = useMemo(
    () => (selectedLogId ? logs.find((log) => log.id === selectedLogId) : undefined),
    [logs, selectedLogId],
  )

  const [search, setSearch] = useState('')
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      return (
        String(log.msg || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(log.traceId || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(log.step || '')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    })
  }, [logs, search])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <>
      <div className="grid grid-rows-[auto_1fr] h-full" data-testid="logs-container">
        <div className="flex p-2 border-b gap-2" data-testid="logs-search-container">
          <div className="flex-1 relative">
            <Input
              variant="shade"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-9! font-medium"
              placeholder="Search by Trace ID or Message"
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
        <div ref={scrollContainerRef} className="overflow-auto h-full">
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualItems.map((virtualRow) => {
              const log = filteredLogs[virtualRow.index]
              if (!log) return null
              const index = virtualRow.index
              return (
                <div
                  data-testid="log-row"
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  key={log.id}
                  role="row"
                  tabIndex={0}
                  className={cn(
                    'absolute left-0 w-full flex items-center font-mono font-semibold cursor-pointer text-sm',
                    {
                      'bg-muted-foreground/10 hover:bg-muted-foreground/20': selectedLogId === log.id,
                      'hover:bg-muted-foreground/10': selectedLogId !== log.id,
                    },
                  )}
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => selectLogId(log.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      selectLogId(log.id)
                    }
                  }}
                >
                  <div
                    data-testid={`time-${index}`}
                    role="cell"
                    className="whitespace-nowrap flex items-center gap-2 text-muted-foreground p-2 shrink-0"
                  >
                    <LevelDot level={log.level} />
                    {formatTimestamp(log.time)}
                  </div>
                  <button
                    type="button"
                    data-testid={`trace-${log.traceId}`}
                    className="whitespace-nowrap cursor-pointer hover:text-primary text-muted-foreground p-2 shrink-0 bg-transparent border-0 text-left font-mono font-semibold text-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSearch(log.traceId)
                    }}
                  >
                    {log.traceId}
                  </button>
                  <div
                    data-testid={`step-${index}`}
                    role="cell"
                    title={log.step}
                    className="whitespace-nowrap p-2 shrink-0"
                  >
                    {log.step}
                  </div>
                  <div
                    data-testid={`msg-${index}`}
                    role="cell"
                    title={log.msg}
                    className="whitespace-nowrap max-w-[500px] truncate p-2 flex-1"
                  >
                    {log.msg}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <LogDetail log={selectedLog} onClose={() => selectLogId(undefined)} />
    </>
  )
}
