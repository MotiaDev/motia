import { Button, cn, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@motiadev/ui'
import { ListFilter, Search, Trash, X } from 'lucide-react'
import { memo } from 'react'
import { useObservabilityStore } from '../stores/use-observability-store'
import type { TraceStatus } from '../types/observability'

export const SearchBar = memo(() => {
  const search = useObservabilityStore((state) => state.search)
  const setSearch = useObservabilityStore((state) => state.setSearch)
  const statusFilter = useObservabilityStore((state) => state.statusFilter)
  const setStatusFilter = useObservabilityStore((state) => state.setStatusFilter)
  const clearTraces = useObservabilityStore((state) => state.clearTraces)

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as TraceStatus | 'all')
  }

  return (
    <div className="flex p-2 border-b gap-2" data-testid="logs-search-container">
      <div className="flex-1 relative">
        <Input
          variant="shade"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-9! font-medium"
          placeholder="Search by Trace ID or Step Name"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <X
          className={cn(
            'cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground',
            {
              visible: search !== '',
              invisible: search === '',
            },
          )}
          onClick={() => setSearch('')}
        />
      </div>
      <Select value={statusFilter} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-auto h-8.5 gap-2 px-3">
          <ListFilter className="w-3.5 h-3.5 text-muted-foreground" />
          {statusFilter === 'all' ? <span>Status</span> : <SelectValue />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="running">Running</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="default" onClick={clearTraces} className="h-[34px]">
        <Trash /> Clear
      </Button>
    </div>
  )
})

SearchBar.displayName = 'SearchBar'
