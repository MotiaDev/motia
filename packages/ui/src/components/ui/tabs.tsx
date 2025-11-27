import * as TabsPrimitive from '@radix-ui/react-tabs'
import { FC, ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const Tabs: FC<ComponentProps<typeof TabsPrimitive.Root>> = ({ className, ...props }) => {
  return <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col h-full', className)} {...props} />
}
Tabs.displayName = 'Tabs'

export const TabsList: FC<ComponentProps<typeof TabsPrimitive.List>> = ({ className, ...props }) => {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('inline-flex rounded-none bg-transparent p-0 min-h-10', className)}
      {...props}
    />
  )
}
TabsList.displayName = 'TabsList'

export const TabsTrigger: FC<ComponentProps<typeof TabsPrimitive.Trigger>> = ({ className, ...props }) => {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-none px-4 py-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-0.5 data-[state=active]:after:w-[calc(100%-2.5rem)] data-[state=active]:after:bg-foreground data-[state=active]:after:rounded-full",
        className,
      )}
      {...props}
    />
  )
}
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent: FC<ComponentProps<typeof TabsPrimitive.Content>> = ({ className, ...props }) => {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none text-foreground', className)}
      {...props}
    />
  )
}
TabsContent.displayName = 'TabsContent'
