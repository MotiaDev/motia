import { TraceGroup } from '@/types/observability'
import { Badge, BadgeProps } from '@motiadev/ui'
import React, { useMemo } from 'react'

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
