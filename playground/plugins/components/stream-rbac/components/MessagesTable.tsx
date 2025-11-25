import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@motiadev/ui'
import { memo, useMemo } from 'react'
import { useStreamRbacStore } from '../store'
import { getAuthorBadgeVariant, getStatusBadgeVariant, sortMessagesByUpdatedAt } from '../utils'

export const MessagesTable = memo(() => {
  const { messages } = useStreamRbacStore()
  const sortedMessages = useMemo(() => sortMessagesByUpdatedAt(messages), [messages])

  return (
    <div className="max-h-[500px] overflow-auto rounded-lg border border-slate-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[15%]">Author</TableHead>
            <TableHead className="w-[15%]">Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[120px]">ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!sortedMessages.length ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-slate-400">
                Waiting for stream events…
              </TableCell>
            </TableRow>
          ) : (
            sortedMessages.map((item, index) => {
              const authorVariant = getAuthorBadgeVariant(item.from)
              const statusVariant = getStatusBadgeVariant(item.status)
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant={authorVariant} className="text-xs">
                      {item.from ?? 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant} className="text-xs">
                      {item.status ?? 'created'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-pre-line break-words">{item.message ?? ''}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono truncate">{item.id}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
})

MessagesTable.displayName = 'MessagesTable'
