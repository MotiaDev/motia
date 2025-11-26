import { cva, type VariantProps } from 'class-variance-authority'
import type { FC, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-4 py-1 text-xs font-bold transition-colors', {
  variants: {
    variant: {
      info: 'dark:bg-accent-100 dark:text-accent-1000 bg-accent-200 text-accent-900 capitalize',
      success: 'bg-accent-1000 text-white',
      error: 'bg-destructive/10 text-destructive capitalize',
      default: 'dark:bg-gray-800/30 dark:text-gray-500 bg-gray-100 text-gray-800',
      outline: 'border border-gray-200 dark:border-gray-700',
      warning: 'border-transparent bg-amber-300 text-amber-950 hover:bg-amber/80',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export const Badge: FC<BadgeProps> = ({ className, variant, ...props }) => {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

Badge.displayName = 'Badge'
