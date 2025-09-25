import { cn } from '@/lib/utils'
import { FC, ReactNode, useMemo } from 'react'
import { Button } from './button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { BackgroundEffect } from './background-effect'

export interface PanelDetailItemProps {
  label: string | ReactNode
  value: string | ReactNode
  highlighted?: boolean
}

export interface PanelAction {
  active?: boolean
  icon: ReactNode
  onClick: () => void
  label?: string
}

export interface PanelProps {
  'data-testid'?: string
  title?: ReactNode
  subtitle?: ReactNode
  details?: PanelDetailItemProps[]
  actions?: PanelAction[]
  className?: string
  children?: ReactNode
  size?: 'sm' | 'md'
  variant?: 'default' | 'outlined' | 'filled' | 'ghost'
  tabs?: {
    label: string
    labelComponent?: ReactNode
    content: ReactNode
    'data-testid'?: string
  }[]
  contentClassName?: string
}

const panelVariants = {
  default: 'bg-transparent border border-border',
  outlined: 'bg-transparent border-2 border-border',
  filled: 'bg-muted border border-transparent',
  ghost: 'bg-transparent border-transparent shadow-none',
}

export const PanelDetailItem: FC<PanelDetailItemProps> = ({ label, value, highlighted }) => {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex items-center h-8 shrink-0">
        <span className="text-sm font-medium text-foreground tracking-[-0.25px] w-24 truncate">{label}</span>
      </div>
      <div className={cn('flex-1 rounded-lg px-2 py-1 min-h-6', highlighted && 'bg-secondary')}>
        <div className="flex items-center min-h-6">
          {typeof value === 'string' ? (
            <span className="text-sm font-medium text-muted-foreground tracking-[-0.25px] leading-tight">{value}</span>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  )
}

export const Panel: FC<PanelProps> = ({
  'data-testid': dataTestId,
  title,
  subtitle,
  details,
  actions,
  className,
  children,
  size,
  variant = 'default',
  contentClassName,
  tabs,
}) => {
  const hasTabs = tabs && tabs.length > 0

  const content = useMemo(() => {
    const _view = (
      <>
        {hasTabs && (
          <TabsList
            className={cn('bg-card border-b border-border px-1 pt-5', {
              'bg-transparent': variant === 'ghost',
            })}
          >
            {tabs?.map((tab) => (
              <TabsTrigger
                key={tab.label}
                value={tab.label}
                data-testid={tab['data-testid']}
                className="cursor-pointer"
              >
                {tab.labelComponent || tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        <div className={cn('flex flex-col gap-2 p-4', contentClassName)}>
          {details?.map((detail, index) => <PanelDetailItem key={index} {...detail} />)}

          {hasTabs &&
            tabs.map((tab) => (
              <TabsContent key={tab.label} value={tab.label}>
                {tab.content}
              </TabsContent>
            ))}

          {children}
        </div>
      </>
    )

    if (hasTabs) {
      return <Tabs defaultValue={tabs?.[0]?.label}>{_view}</Tabs>
    }

    return _view
  }, [tabs, variant, size, title, subtitle, details, actions, contentClassName, children, hasTabs])

  return (
    <div
      className={cn(
        'relative isolate size-full backdrop-blur-[48px] backdrop-filter',
        'text-foreground',
        'rounded-lg overflow-hidden',
        panelVariants[variant],
        className,
      )}
      data-testid={dataTestId}
    >
      <BackgroundEffect />
      <div className="flex flex-col size-full">
        <div
          className={cn('relative shrink-0 w-full border-b border-border bg-card', {
            'bg-transparent': variant === 'ghost',
            'border-b-0': hasTabs,
          })}
        >
          {title && (
            <div
              className={cn('flex flex-col gap-1 px-5 py-4', {
                'px-4 py-3': size === 'sm',
                'px-5 py-4': size === 'md',
                'pb-0': hasTabs,
              })}
            >
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
                      <Button
                        key={index}
                        onClick={action.onClick}
                        variant="ghost"
                        className={cn(action.active && 'bg-muted-foreground/20 hover:bg-muted-foreground/30')}
                        size="icon"
                        aria-label={action.label}
                        data-testid="close-panel"
                      >
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
          )}
        </div>

        <div className="flex-1 overflow-auto">{content}</div>
      </div>
    </div>
  )
}

Panel.displayName = 'Panel'
