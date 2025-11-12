import { APP_SIDEBAR_CONTAINER_ID, CollapsiblePanelGroup } from '@motiadev/ui'
import { memo } from 'react'
import { BottomPanel } from './components/bottom-panel'
import { Header } from './components/header/header'
import { TopPanel } from './components/top-panel'

export const SystemViewMode = memo(() => {
  return (
    <div className="grid grid-rows-[auto_1fr] grid-cols-[1fr_auto] bg-background text-foreground h-screen">
      <div className="col-span-2">
        <Header />
      </div>
      <main className="m-2 overflow-hidden">
        <CollapsiblePanelGroup
          autoSaveId="app-panel"
          direction="vertical"
          className="gap-1 h-full"
          aria-label="Workbench panels"
        >
          <TopPanel />
          <BottomPanel />
        </CollapsiblePanelGroup>
      </main>
      <div id={APP_SIDEBAR_CONTAINER_ID} />
    </div>
  )
})
SystemViewMode.displayName = 'SystemViewMode'
