import { cn } from '@motiadev/ui'
import { type FC, memo, useMemo } from 'react'
import type { ConnectionState } from '../types'

type StatusIndicatorProps = {
  connectionState: ConnectionState
}

export const StatusIndicator: FC<StatusIndicatorProps> = memo(({ connectionState }) => {
  const statusLabel = useMemo(() => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting…'
      case 'connected':
        return 'Connected'
      default:
        return 'Disconnected'
    }
  }, [connectionState])

  return (
    <div className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-slate-600 bg-slate-900/75 w-fit">
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          connectionState === 'connecting'
            ? 'bg-yellow-500'
            : connectionState === 'connected'
              ? 'bg-green-500'
              : 'bg-red-500',
        )}
      />
      <span>{statusLabel}</span>
    </div>
  )
})

StatusIndicator.displayName = 'StatusIndicator'
