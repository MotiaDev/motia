import { cn } from '@/lib/utils'
import { Button } from './button'
import { FC, ReactNode } from 'react'

export interface PanelDetailItem {
  label: string
  value: string | ReactNode
  highlighted?: boolean
}

export interface PanelAction {
  icon: ReactNode
  onClick: () => void
  label?: string
}

export interface PanelProps {
  title: ReactNode
  subtitle?: ReactNode
  details?: PanelDetailItem[]
  actions?: PanelAction[]
  className?: string
  children?: ReactNode
  size?: 'sm' | 'md'
}

export const Panel: FC<PanelProps> = ({ title, subtitle, details, actions, className, children, size }) => {
  return (
    <div
      className={cn(
        'relative size-full backdrop-blur-[48px] backdrop-filter',
        'text-foreground',
        'border border-border',
        'rounded-lg overflow-hidden',
        className,
      )}
    >
      <div className="flex flex-col size-full">
        <div className="relative shrink-0 w-full border-b border-border bg-card">
          <div className={cn('flex flex-col gap-1', size === 'sm' ? 'px-4 py-3' : 'px-5 py-4')}>
            <div className="flex items-center w-full">
              <div
                className={cn(
                  'font-semibold text-foreground tracking-[-0.25px] leading-tight flex-1',
                  size === 'sm' ? 'text-xs' : 'text-base',
                )}
              >
                {title}
              </div>
              {actions && actions.length > 0 && (
                <div className="flex items-center gap-1">
                  {actions.map((action, index) => (
                    <Button key={index} onClick={action.onClick} variant="ghost" size="icon" aria-label={action.label}>
                      {action.icon}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-sm font-medium text-muted-foreground tracking-[-0.25px] leading-tight">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-2 px-5 py-4">
            {details?.map((detail, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex items-center h-8 shrink-0">
                  <span className="text-sm font-medium text-foreground tracking-[-0.25px] w-24 truncate">
                    {detail.label}
                  </span>
                </div>
                <div className={cn('flex-1 rounded-lg px-2 py-1 min-h-6', detail.highlighted && 'bg-secondary')}>
                  <div className="flex items-center min-h-6">
                    {typeof detail.value === 'string' ? (
                      <span className="text-sm font-medium text-muted-foreground tracking-[-0.25px] leading-tight">
                        {detail.value}
                      </span>
                    ) : (
                      detail.value
                    )}
                  </div>
                </div>
              </div>
            ))}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
Panel.displayName = 'Panel'
