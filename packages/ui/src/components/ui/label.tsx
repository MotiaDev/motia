import * as LabelPrimitive from '@radix-ui/react-label'
import { ComponentProps, FC } from 'react'

import { cn } from '@/lib/utils'

export const Label: FC<ComponentProps<typeof LabelPrimitive.Root>> = ({
  className,
  ...props
}) => {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

Label.displayName = LabelPrimitive.Root.displayName
