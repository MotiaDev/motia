import { CollapsiblePanel, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { type AppTabsState, TabLocation, useAppTabsStore } from '../stores/use-app-tabs-store'
import { useTabsStore } from '../stores/use-tabs-store'
import { TabErrorBoundary } from './tab-error-boundary'

const topTabsSelector = (state: AppTabsState) => state.tabs[TabLocation.TOP]
const topPanelId = 'top-panel'

export const TopPanel = memo(() => {
  const defaultTab = useTabsStore((state) => state.tab.top)
  const setTopTab = useTabsStore((state) => state.setTopTab)
  const tabs = useAppTabsStore(useShallow(topTabsSelector))

  return (
    <CollapsiblePanel
      id={topPanelId}
      variant={'tabs'}
      defaultTab={defaultTab}
      onTabChange={setTopTab}
      withResizeHandle
      header={
        <TabsList>
          {tabs.map(({ id, tabLabel: Label }) => (
            <TabsTrigger key={id} value={id} data-testid={`${id.toLowerCase()}-link`} className="cursor-pointer">
              <Label />
            </TabsTrigger>
          ))}
        </TabsList>
      }
    >
      {tabs.map(({ id, content: Element }) => (
        <TabsContent key={id} value={id} className="h-full">
          <TabErrorBoundary tabId={id}>
            <Element />
          </TabErrorBoundary>
        </TabsContent>
      ))}
    </CollapsiblePanel>
  )
})
TopPanel.displayName = 'TopPanel'
