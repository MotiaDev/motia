import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground hover:bg-input active:bg-secondary',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80',
        light: 'bg-background text-foreground border border-border hover:bg-muted active:bg-muted/80',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:opacity-90 active:opacity-80',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90 active:opacity-80',
        outline: 'border border-border bg-transparent hover:bg-muted hover:text-muted-foreground text-foreground',
        ghost: 'hover:bg-muted-foreground/20 text-foreground',
        link: 'text-primary underline-offset-4 hover:underline text-primary-foreground',
        icon: 'hover:bg-muted-foreground/20 text-foreground rounded-full bg-muted-foreground/10',
      },
      size: {
        sm: 'h-6 px-3 text-xs [&_svg]:size-3',
        default: 'h-9 px-4 text-sm [&_svg]:size-4',
        md: 'h-9 px-4 text-sm [&_svg]:size-4',
        lg: 'h-11 px-6 text-base [&_svg]:size-5',
        icon: 'h-4 w-4 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={buttonVariants({ variant, size, className })} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'
