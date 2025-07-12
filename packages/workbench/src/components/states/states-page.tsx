import { useGlobalStore } from '@/stores/use-global-store'
import { cn } from '@motiadev/ui'
import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { StateItem, useGetStateItems } from './hooks/states-hooks'
import { StateSidebar } from './state-sidebar'

export const StatesPage = () => {
  const selectedStateId = useGlobalStore((state) => state.selectedStateId)
  const selectStateId = useGlobalStore((state) => state.selectStateId)
  const items = useGetStateItems()
  const selectedItem = useMemo(
    () => (selectedStateId ? items.find((item) => `${item.groupId}:${item.key}` === selectedStateId) : null),
    [items, selectedStateId],
  )

  const handleRowClick = (item: StateItem) => selectStateId(`${item.groupId}:${item.key}`)
  const onClose = () => selectStateId(undefined)

  return (
    <div className="flex flex-row gap-4 h-full">
      {selectedItem && <StateSidebar state={selectedItem} onClose={onClose} />}

      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="rounded-0">Group ID</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
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
  )
}
