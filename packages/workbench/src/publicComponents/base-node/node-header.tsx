import { cn } from '@motiadev/ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { CalendarClock, CircleOff, Link2, Waypoints } from 'lucide-react'
import type React from 'react'
import type { PropsWithChildren } from 'react'

const baseIcon = cva('rounded-md p-2', {
  variants: {
    variant: {
      event: 'bg-[rgba(30,118,231,0.2)] text-[rgb(30,118,231)]',
      api: 'dark:bg-[rgba(192,255,17,0.2)] dark:text-[rgb(192,255,17)] bg-[rgb(231,255,166)] text-[rgb(94,125,11)]',
      noop: 'bg-[rgba(239,18,229,0.2)] text-[rgb(239,18,229)]',
      cron: 'bg-[rgba(241,105,15,0.2)] text-[rgb(241,105,15)]',
    },
  },
})

const NodeIcon = ({ variant }: { variant: VariantProps<typeof baseIcon>['variant'] }) => {
  if (variant === 'cron') {
    return <CalendarClock className="w-5 h-5" />
  } else if (variant === 'api') {
    return <Link2 className="w-5 h-5" />
  } else if (variant === 'noop') {
    return <CircleOff className="w-5 h-5" />
  } else if (variant === 'event') {
    return <Waypoints className="w-5 h-5" />
  }
  return <div className={cn(baseIcon({ variant }))}>Icon</div>
}

type Props = PropsWithChildren<{
  text: string
  variant: VariantProps<typeof baseIcon>['variant']
  className?: string
}>

export const NodeHeader: React.FC<Props> = ({ text, variant, children, className }) => (
  <div className={cn('flex items-center gap-2 p-2', className)}>
    <div className={baseIcon({ variant })}>
      <NodeIcon variant={variant} />
    </div>
    <div className="flex flex-1 justify-between items-start gap-4">
      <div className="flex flex-col">
        <div className="text-sm font-semibold leading-[1.25] tracking-[-0.25px]">{text}</div>
      </div>
      {children}
    </div>
  </div>
)
