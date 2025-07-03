import React, { PropsWithChildren, ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Container, ContainerContent, ContainerHeader, ContainerHeaderProps } from '@/components/ui/container.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ChevronDown, Equal } from 'lucide-react'
import { cn } from '@/lib/utils.ts'
import { Tabs } from '@/components/ui/tabs.tsx'

export interface CollapsiblePanelProps extends PropsWithChildren {
  id: string
  header: ReactNode
  withResizeHandle?: boolean
  className?: string
  variant?: ContainerHeaderProps['variant']
  defaultTab?: string
}

interface PanelControlProps {
  header: ReactNode
  isCollapsed: boolean
  onToggle?: () => void
  variant?: ContainerHeaderProps['variant']
}

const PanelControls: React.FC<PanelControlProps> = ({ header, isCollapsed, onToggle, variant = 'default' }) => {
  return (
    <ContainerHeader variant={variant}>
      {header}
      <div className="flex-1" />
      {onToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          className={cn({
            'mr-5': variant === 'tabs',
          })}
        >
          <ChevronDown
            className={cn('w-6 h-6 transition-transform', {
              '-rotate-90': !isCollapsed,
            })}
          />
        </Button>
      )}
    </ContainerHeader>
  )
}

const CustomResizeHandle: React.FC = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <PanelResizeHandle className="group relative">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border">
            <Equal className="h-4 w-4 text-muted-foreground" />
          </div>
        </PanelResizeHandle>
      </div>
    </div>
  )
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  id,
  header,
  children,
  withResizeHandle,
  className,
  variant,
  defaultTab,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const panelRef = useRef<ImperativePanelHandle>(null)

  const onToggle = useCallback(() => {
    const panel = panelRef.current
    if (!panel) return

    try {
      if (panel.isCollapsed()) {
        panel.expand()
      } else {
        panel.collapse()
      }
    } catch (error) {
      console.warn('Failed to toggle panel:', error)
    }
  }, [])

  const onCollapse = useCallback(() => setIsCollapsed(true), [])
  const onExpand = useCallback(() => setIsCollapsed(false), [])

  const view = useMemo(() => {
    const container = (
      <Container className="h-full">
        <PanelControls header={header} isCollapsed={isCollapsed} variant={variant} onToggle={onToggle} />
        <ContainerContent>{children}</ContainerContent>
      </Container>
    )
    if (variant == 'tabs') {
      return (
        <Tabs className="h-full" defaultValue={defaultTab}>
          {container}
        </Tabs>
      )
    }
    return container
  }, [variant, isCollapsed, header, children, defaultTab, onToggle])

  return (
    <>
      <Panel
        id={id}
        collapsible
        ref={panelRef}
        className={cn('min-h-[42px]', className)}
        onCollapse={onCollapse}
        onExpand={onExpand}
      >
        {view}
      </Panel>
      {withResizeHandle && <CustomResizeHandle />}
    </>
  )
}

export const CollapsiblePanelGroup: React.FC<React.ComponentProps<typeof PanelGroup>> = ({ children, ...props }) => {
  const [resizeHandleCount, setResizeHandleCount] = useState(0)
  return (
    <PanelGroup
      onLayout={(sizes) => {
        setResizeHandleCount(sizes.length)
      }}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<CollapsiblePanelProps>(child)) {
          const last = resizeHandleCount - 1 === index
          const hasResizeHandle = resizeHandleCount > 1
          return React.cloneElement(child, { withResizeHandle: hasResizeHandle && !last })
        }
        return child
      })}
    </PanelGroup>
  )
}
