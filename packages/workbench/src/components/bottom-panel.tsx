import { CollapsiblePanel, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { type AppTabsState, TabLocation, useAppTabsStore } from '../stores/use-app-tabs-store'
import { useTabsStore } from '../stores/use-tabs-store'
import { TabErrorBoundary } from './tab-error-boundary'

const bottomTabsSelector = (state: AppTabsState) => state.tabs[TabLocation.BOTTOM]
const bottomPanelId = 'bottom-panel'

export const BottomPanel = memo(() => {
  const defaultTab = useTabsStore((state) => state.tab.bottom)
  const setBottomTab = useTabsStore((state) => state.setBottomTab)
  const tabs = useAppTabsStore(useShallow(bottomTabsSelector))

  return (
    <CollapsiblePanel
      id={bottomPanelId}
      variant={'tabs'}
      defaultTab={defaultTab}
      onTabChange={setBottomTab}
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
BottomPanel.displayName = 'BottomPanel'
