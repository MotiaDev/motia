import { cva } from 'class-variance-authority'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import React from 'react'
import { cn } from '../../lib/utils'
import { TraceGroup } from '../../types/observability'

export const LoadingSpinner: React.FC<{ className: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('animate-spin', className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
    case 'active':
      return <LoadingSpinner className="w-4 h-4 text-blue-500" />
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'stalled':
      return <Clock className="w-4 h-4 text-yellow-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

const statusVariants = cva(
  'inline-flex items-center rounded-lg px-3 py-[2px] uppercase text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      status: {
        running: 'dark:bg-blue-800/30 dark:text-blue-500 bg-blue-100 text-blue-700',
        active: 'dark:bg-blue-800/30 dark:text-blue-500 bg-blue-100 text-blue-700',
        completed: 'dark:bg-green-800/30 dark:text-green-500 bg-green-100 text-green-700',
        failed: 'dark:bg-red-800/30 dark:text-red-500 bg-red-100 text-red-700',
        stalled: 'dark:bg-yellow-800/30 dark:text-yellow-500 bg-yellow-100 text-yellow-700',
        default: 'dark:bg-gray-800/30 dark:text-gray-500 bg-gray-100 text-gray-800',
      },
    },
    defaultVariants: {
      status: 'default',
    },
  },
)

export const TraceStatus: React.FC<{ status: TraceGroup['status']; name: string }> = ({ status, name }) => {
  return (
    <div className="flex items-center gap-2">
      {getStatusIcon(status)}
      <span className="font-medium text-sm">{name}</span>
    </div>
  )
}

export const TraceStatusBadge: React.FC<{ status: TraceGroup['status'] }> = ({ status }) => {
  return <div className={statusVariants({ status })}>{status}</div>
}
