import React from 'react'
import { Badge, BadgeProps } from '@motiadev/ui'

const map: Record<string, BadgeProps['variant']> = {
  info: 'info',
  error: 'error',
  warn: 'warning',
  debug: 'info',
}

export const LogLevelBadge: React.FC<{ level: string; className?: string }> = (props) => {
  return (
    <Badge variant={map[props.level] as BadgeProps['variant']} className={props.className}>
      {props.level}
    </Badge>
  )
}
