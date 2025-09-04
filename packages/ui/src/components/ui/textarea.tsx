import type { ComponentProps, FC } from 'react'

import { cn } from '@/lib/utils'

export const Textarea: FC<ComponentProps<'textarea'>> = ({ className, ...props }) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex w-full rounded-md px-3 py-2 text-base transition-colors outline-none resize-none',
        'min-h-[80px] field-sizing-content',
        'bg-input',
        'border border-border',
        'text-foreground placeholder:text-muted-foreground',
        'hover:border-border',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
        'aria-invalid:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'text-sm font-medium leading-[1.3] tracking-[-0.01em]',
        className,
      )}
      {...props}
    />
  )
}
Textarea.displayName = 'Textarea'
