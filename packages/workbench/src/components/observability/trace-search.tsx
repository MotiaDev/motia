import { useState } from 'react'
import { TraceFilter } from '@/types/observability'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'

interface TraceSearchProps {
  onSearch: (filter: TraceFilter) => void
}

export const TraceSearch = ({ onSearch }: TraceSearchProps) => {
  const [status, setStatus] = useState<string>('')
  const [stepName, setStepName] = useState('')
  const [correlationId, setCorrelationId] = useState('')

  const handleSearch = () => {
    const filter: TraceFilter = {
      ...(status && status !== 'all' && { status: status as any }),
      ...(stepName && { stepName }),
      ...(correlationId && { correlationId }),
      limit: 50
    }
    onSearch(filter)
  }

  const handleClear = () => {
    setStatus('')
    setStepName('')
    setCorrelationId('')
    onSearch({})
  }

  const hasFilters = (status && status !== 'all') || stepName || correlationId

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Step Name</label>
          <Input
            placeholder="Filter by step name..."
            value={stepName}
            onChange={(e) => setStepName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Correlation ID</label>
          <Input
            placeholder="Filter by correlation ID..."
            value={correlationId}
            onChange={(e) => setCorrelationId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSearch} size="sm">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
        
        {hasFilters && (
          <Button onClick={handleClear} variant="outline" size="sm">
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
} 