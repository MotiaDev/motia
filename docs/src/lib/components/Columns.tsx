import React, { type PropsWithChildren } from 'react'
import { cn } from '../utils'

type ColumnsProps = PropsWithChildren<{
  cols?: number
  className?: string
}>

export const Columns: React.FC<ColumnsProps> = ({ cols = 2, className = '', children }) => {
  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6 grid-cols-1 auto-rows-min md:auto-cols-min',
        `md:grid-cols-${cols}`,
        className,
      )}
    >
      {children}
    </div>
  )
}
