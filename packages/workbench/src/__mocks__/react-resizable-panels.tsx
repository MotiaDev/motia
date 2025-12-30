import type React from 'react'

export const Panel = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>): React.ReactNode => {
  return (
    <div data-testid="panel" {...props}>
      {children}
    </div>
  )
}

export const PanelGroup = ({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>): React.ReactNode => {
  return (
    <div data-testid="panel-group" {...props}>
      {children}
    </div>
  )
}

export const PanelResizeHandle = (props: Record<string, unknown>): React.ReactNode => {
  return <div data-testid="panel-resize-handle" {...props} />
}
