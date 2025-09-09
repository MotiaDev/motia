import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export const Tooltip = ({
  children,
  content,
  disabled,
}: {
  children: ReactNode
  content: string | ReactNode
  disabled?: boolean
}) => (
  <TooltipPrimitive.Provider disableHoverableContent={disabled}>
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content className="TooltipContent" side="bottom">
          <div className="p-2 bg-background text-popover-foreground text-sm rounded-lg border border-light-800">
            {content}
          </div>
          <TooltipPrimitive.Arrow className="TooltipArrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
)
