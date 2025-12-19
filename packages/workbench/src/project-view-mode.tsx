import { APP_SIDEBAR_CONTAINER_ID, Panel } from '@motiadev/ui'
import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { TabErrorBoundary } from './components/tab-error-boundary'
import { type AppTabsState, TabLocation, useAppTabsStore } from './stores/use-app-tabs-store'

const topTabs = (state: AppTabsState) => state.tabs[TabLocation.TOP]

export const ProjectViewMode = memo(() => {
  const tabs = useAppTabsStore(useShallow(topTabs))

  return (
    <div className="grid grid-rows-1 grid-cols-[1fr_auto] bg-background text-foreground h-screen ">
      <main className="m-2 overflow-hidden">
        <Panel
          contentClassName={'p-0'}
          tabs={tabs.map((tab) => {
            const Element = tab.content
            const LabelComponent = tab.tabLabel
            return {
              label: tab.id,
              labelComponent: <LabelComponent />,
              content: (
                <TabErrorBoundary tabId={tab.id}>
                  <Element />
                </TabErrorBoundary>
              ),
              'data-testid': tab.id,
            }
          })}
        />
      </main>
      <div id={APP_SIDEBAR_CONTAINER_ID} />
    </div>
  )
})
ProjectViewMode.displayName = 'ProjectViewMode'
