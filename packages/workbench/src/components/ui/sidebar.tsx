import React, { PropsWithChildren, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@motiadev/ui'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

export const Sidebar: React.FC<PropsWithChildren> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      return saved ? JSON.parse(saved) : true
    }
    return true
  })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(isCollapsed))
  }, [isCollapsed])

  return (
    <div
      className={cn(
        'max-h-screen overflow-y-auto transition-[width] duration-300 border-r border-sidebar-border bg-sidebar text-sidebar-foreground border-solid overflow-hidden relative',
        isCollapsed ? 'w-[50px]' : 'w-[250px]',
      )}
    >
      <div className="flex items-center justify-end gap-2 absolute top-3 right-1">
        <Button variant="ghost" size="icon" data-testid="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      {!isCollapsed && <div className="overflow-y-auto w-[250px] mt-4">{children}</div>}
    </div>
  )
}

export const SidebarGroup: React.FC<PropsWithChildren<{ title: string; testId?: string }>> = ({
  children,
  title,
  testId,
}) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xs font-bold text-muted-foreground px-4 py-2 uppercase" data-testid={testId}>
        {title}
      </h2>
      {children}
    </div>
  )
}

type SidebarButtonProps = PropsWithChildren<{
  isActive: boolean
  icon: React.ReactNode
}>

export const SidebarButton: React.FC<SidebarButtonProps> = ({ children, isActive, icon }) => {
  return (
    <div
      className={cn(
        'flex text-sm font-medium items-center gap-2 px-4 py-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
      )}
    >
      <div className="text-sidebar-foreground/70">{icon}</div>
      {children}
    </div>
  )
}
