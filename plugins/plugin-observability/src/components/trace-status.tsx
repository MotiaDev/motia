import { Badge, type BadgeProps } from '@motiadev/ui'
import type React from 'react'
import { useMemo } from 'react'
import type { TraceGroup } from '@/types/observability'

type Props = {
  status: TraceGroup['status']
  duration?: string
}

export const TraceStatusBadge: React.FC<Props> = ({ status, duration }) => {
  const variant = useMemo(() => {
    if (status === 'running') {
      return 'info'
    }
    if (status === 'completed') {
      return 'success'
    }
    if (status === 'failed') {
      return 'error'
    }
    return 'default'
  }, [status]) as BadgeProps['variant']

  return <Badge variant={variant}>{duration && status !== 'failed' ? duration : status}</Badge>
}
