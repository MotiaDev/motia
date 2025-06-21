import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from './button'

interface PanelDetailItem {
  label: string
  value: string | React.ReactNode
  highlighted?: boolean
}

interface PanelAction {
  icon: React.ReactNode
  onClick: () => void
  label?: string
}

interface PanelProps {
  title: string
  subtitle?: string
  details: PanelDetailItem[]
  actions?: PanelAction[]
  className?: string
  children?: React.ReactNode
}

function Panel({ title, subtitle, details, actions, className, children }: PanelProps) {
  return (
    <div
      className={cn(
        "relative size-full backdrop-blur-[48px] backdrop-filter",
        "bg-card",
        "text-foreground",
        "border border-border",
        "rounded-lg overflow-hidden",
        className
      )}
    >

      <div className="flex flex-col size-full">
        <div className="relative shrink-0 w-full border-b border-border">
          <div className="flex flex-col gap-1 px-5 py-4">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-base font-semibold text-foreground tracking-[-0.25px] leading-tight">
                {title}
              </h2>
              {actions && actions.length > 0 && (
                <div className="flex items-center gap-1">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      variant="ghost"
                      size="icon"
                      aria-label={action.label}
                    >
                      {action.icon}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-sm font-medium text-muted-foreground tracking-[-0.25px] leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-2 px-5 py-4">
            {details.map((detail, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex items-center h-8 shrink-0">
                  <span className="text-sm font-medium text-foreground tracking-[-0.25px] w-24 truncate">
                    {detail.label}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1 min-h-6",
                    detail.highlighted && "bg-secondary"
                  )}
                >
                  <div className="flex items-center min-h-6">
                    {typeof detail.value === "string" ? (
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

export { Panel }
export type { PanelProps, PanelDetailItem, PanelAction } 