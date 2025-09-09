import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('border border-border text-foreground rounded-lg overflow-hidden flex flex-col h-full', className)}
      {...props}
    >
      {children}
    </div>
  )
})
Container.displayName = 'Container'

const containerHeaderVariants = cva('w-full bg-card flex min-h-10 items-center', {
  variants: {
    variant: {
      default: 'px-5 py-2 items-center',
      tabs: 'p-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type ContainerHeaderProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof containerHeaderVariants>

export const ContainerHeader = forwardRef<HTMLDivElement, ContainerHeaderProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(containerHeaderVariants({ variant, className }))} {...props}>
        {children}
      </div>
    )
  },
)
ContainerHeader.displayName = 'ContainerHeader'

export const ContainerContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex-1 overflow-auto bg-default border-border border-t', className)} {...props} />
    )
  },
)
ContainerContent.displayName = 'ContainerContent'
