import { forwardRef, InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const inputVariants = cva(
  cn(
    'flex w-full rounded-md px-3 py-2 text-base transition-colors outline-none resize-none',
    'field-sizing-content',
    'aria-invalid:border-destructive',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'text-sm font-medium leading-[1.3] tracking-[-0.01em]',
  ),
  {
    variants: {
      variant: {
        default:
          'bg-input border border-border hover:border-border focus-visible:border-ring text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20',
        shade: 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/12 focus:bg-muted-foreground/15',
        outline:
          'focus-visible:border-border hover:border-border hover:bg-card focus-visible:bg-card bg-transparent text-foreground border border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, variant, ...props }, ref) => {
  return <input type={type} className={inputVariants({ variant, className })} ref={ref} {...props} />
})
Input.displayName = 'Input'
