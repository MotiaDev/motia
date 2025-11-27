import { cn } from '@/lib/utils'
import { Button } from './button'
import { X } from 'lucide-react'
import { FC } from 'react'

export interface PanelDetailItem {
  label: string
  value: string | React.ReactNode
  highlighted?: boolean
}

export interface PanelAction {
  icon: React.ReactNode
  onClick: () => void
  label?: string
}

export interface PanelProps {
  title: string
  subtitle?: string
  actions?: PanelAction[]
  className?: string
  children?: React.ReactNode
  onClose?: () => void
}

export const SidePanel: FC<PanelProps> = ({ title, subtitle, actions, className, children, onClose }) => {
  return (
    <div
      className={cn('bg-muted-foreground/5 text-foreground border-l border-border overflow-hidden w-1/3', className)}
    >
      <div className="flex flex-col size-full">
        <div className="relative shrink-0 w-full border-b border-border">
          <div className="flex flex-col gap-0 p-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-lg font-semibold text-foreground tracking-[-0.25px] leading-tight">{title}</div>
              <div className="flex items-center gap-1">
                {actions?.map((action, index) => (
                  <Button key={index} onClick={action.onClick} variant="ghost" size="icon" aria-label={action.label}>
                    {action.icon}
                  </Button>
                ))}
                <Button onClick={onClose} variant="ghost" size="icon" aria-label="Close">
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            {subtitle && (
              <div className="text-md font-medium text-muted-foreground tracking-[-0.25px] leading-tight">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-2 p-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

SidePanel.displayName = 'SidePanel'
