import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@motiadev/ui'

const badgeVariants = cva('rounded-lg px-2 py-1 text-sm font-mono font-bold transition-colors', {
  variants: {
    variant: {
      POST: 'bg-[#258DC3]/15 text-[#258DC3]',
      GET: 'bg-[#709A2D]/15 text-[#709A2D]',
      DELETE: 'bg-[#DE2134]/15 text-[#DE2134]',
      PUT: 'bg-yellow-500/50 text-yellow-100', // TODO color
      PATCH: 'bg-yellow-500/50 text-yellow-100', // TODO color
      HEAD: 'bg-blue-500/50 text-blue-100', // TODO color
      OPTIONS: 'bg-purple-500/50 text-purple-100', // TODO color
    },
    defaultVariants: {
      variant: 'bg-blue-500/50 text-blue-100',
    },
  },
})

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function EndpointBadge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
