import { useGlobalStore } from '@/stores/use-global-store'
import { cn, Button, Input } from '@motiadev/ui'
import { useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { StateItem, useGetStateItems } from './hooks/states-hooks'
import { StateSidebar } from './state-sidebar'
import { Database, CircleX } from 'lucide-react'

export const StatesPage = () => {
  const selectedStateId = useGlobalStore((state) => state.selectedStateId)
  const selectStateId = useGlobalStore((state) => state.selectStateId)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [search, setSearch] = useState('')
  const items = useGetStateItems(refreshTrigger)
  const selectedItem = useMemo(
    () => (selectedStateId ? items.find((item) => `${item.groupId}:${item.key}` === selectedStateId) : null),
    [items, selectedStateId],
  )
  const [isClearing, setIsClearing] = useState(false)

  const handleRowClick = (item: StateItem) => selectStateId(`${item.groupId}:${item.key}`)
  const onClose = () => selectStateId(undefined)

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search) return items
    
    return items.filter((item) => {
      return (
        item.groupId.toLowerCase().includes(search.toLowerCase()) ||
        item.key.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [items, search])

  const clearState = async () => {
    setIsClearing(true)
    try {
      const response = await fetch('/__motia/clear-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId: 'all' }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // Refresh the state data
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error clearing state:', error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="flex flex-row gap-4 h-full" data-testid="states-container">
      {selectedItem && <StateSidebar state={selectedItem} onClose={onClose} />}

      <div className="flex-1 flex flex-col">
        <div className="flex p-2 border-b gap-4">
          <div className="flex-1 relative">
            <Input
              variant="shade"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search states by group ID, key, or type..."
              className="pr-10 font-medium"
            />
            <CircleX
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => setSearch('')}
            />
          </div>
          <Button variant="outline" onClick={clearState} disabled={isClearing}>
            <Database className="h-4 w-4 mr-2" />
            {isClearing ? 'Clearing...' : 'Clear State'}
          </Button>
        </div>
        <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="rounded-0">Group ID</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => (
            <TableRow
              data-testid={`item-${item}`}
              key={`${item.groupId}:${item.key}`}
              onClick={() => handleRowClick(item)}
              className={cn(
                'font-mono font-semibold cursor-pointer border-0',
                selectedItem === item
                  ? 'bg-muted-foreground/10 hover:bg-muted-foreground/20'
                  : 'hover:bg-muted-foreground/10',
              )}
            >
              <TableCell className="hover:bg-transparent">{item.groupId}</TableCell>
              <TableCell className="hover:bg-transparent">{item.key}</TableCell>
              <TableCell className="hover:bg-transparent">{item.type}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  )
}
