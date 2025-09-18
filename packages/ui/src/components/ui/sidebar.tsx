import { Panel, type PanelProps } from './panel'
import { createPortal } from 'react-dom'
import { FC, useEffect, useMemo } from 'react'
import { useResizable } from 'react-use-resizable'
import { Equal } from 'lucide-react'

export const APP_SIDEBAR_CONTAINER_ID = 'app-sidebar-container'

const CLOSE_PREVIOUS_SIDEBAR_EVENT = 'close-previous-sidebar'

export type SidebarProps = PanelProps & {
  onClose: () => void
  initialWidth?: number
  containerId?: string
}

export const Sidebar: FC<SidebarProps> = ({ initialWidth, onClose, containerId, ...props }) => {
  const sidebarId = useMemo(() => Symbol(), [])
  const { getRootProps, getHandleProps } = useResizable({
    lockVertical: true,
    initialWidth: initialWidth ?? 400,
    initialHeight: '100%',
    onDragStart: () => {
      document.body.style.userSelect = 'none'
    },
    onDragEnd: () => {
      document.body.style.userSelect = ''
    },
  })

  useEffect(() => {
    const event = new CustomEvent(CLOSE_PREVIOUS_SIDEBAR_EVENT, { detail: { sidebarId } })
    window.dispatchEvent(event)

    const handleClose = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.sidebarId !== sidebarId) {
        onClose()
      }
    }

    window.addEventListener(CLOSE_PREVIOUS_SIDEBAR_EVENT, handleClose)

    return () => {
      window.removeEventListener(CLOSE_PREVIOUS_SIDEBAR_EVENT, handleClose)
    }
  }, [sidebarId, onClose])

  return createPortal(
    <div {...getRootProps()} className="pr-2 py-2 relative">
      <div
        {...getHandleProps({
          reverse: true,
        })}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border absolute top-1/2 -translate-y-1/2 -left-4 z-20"
      >
        <Equal className="rotate-90 w-4 h-4 text-muted-foreground" />
      </div>
      <Panel {...props} variant="outlined" className="max-h-[calc(100vh-80px)] h-full" data-testid="sidebar-panel" />
    </div>,
    document.querySelector(`#${containerId ?? APP_SIDEBAR_CONTAINER_ID}`) as HTMLDivElement,
  )
}
