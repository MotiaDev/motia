import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

const baseDot = cva('w-[6px] h-[6px] rounded-full', {
  variants: {
    variant: {
      event: 'bg-[rgba(0,117,255,1)]',
      api: 'bg-[rgba(189,255,0,1)]',
      noop: 'bg-[rgba(255,49,234,1)]',
      cron: 'bg-[rgba(255,113,11,1)]',
    },
  },
})

const Dot = ({ variant }: { variant: VariantProps<typeof baseDot>['variant'] }) => (
  <div className={cn(baseDot({ variant }))} />
)

export const HeaderBar = ({
  text,
  variant,
  children,
}: {
  text: string
  variant: VariantProps<typeof baseDot>['variant']
  children?: React.ReactNode
}) => (
  <div className="text-sm text-foreground flex justify-between items-center gap-4">
    <div className="flex items-center gap-2">
      <Dot variant={variant} />
      <span>{text}</span>
    </div>
    {children}
  </div>
)
