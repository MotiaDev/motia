import React, { PropsWithChildren } from 'react'
import { AppSidebar } from './components/app-sidebar'
import { ReactFlowProvider } from '@xyflow/react'

export const RouteWrapper: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="flex flex-row bg-background text-foreground">
    <ReactFlowProvider>
      <AppSidebar />
      <div className="flex-1">{children}</div>
    </ReactFlowProvider>
  </div>
)
