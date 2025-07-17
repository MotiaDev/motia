import { TraceGroup } from '@/types/observability'
import { cva } from 'class-variance-authority'
import React from 'react'

const statusVariants = cva('inline-flex items-center rounded-full px-4 py-1 text-xs font-bold transition-colors', {
  variants: {
    status: {
      running: 'dark:bg-accent-100 dark:text-accent-1000 bg-accent-200 text-accent-900 capitalize',
      completed: 'bg-accent-1000 text-white',
      failed: 'bg-destructive/10 text-destructive capitalize',
      default: 'dark:bg-gray-800/30 dark:text-gray-500 bg-gray-100 text-gray-800',
    },
  },
  defaultVariants: {
    status: 'default',
  },
})

type Props = {
  status: TraceGroup['status']
  duration?: string
}

export const TraceStatusBadge: React.FC<Props> = ({ status, duration }) => {
  return <div className={statusVariants({ status })}>{duration && status !== 'failed' ? duration : status}</div>
}
