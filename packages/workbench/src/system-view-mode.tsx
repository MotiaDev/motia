import {
  APP_SIDEBAR_CONTAINER_ID,
  CollapsiblePanel,
  CollapsiblePanelGroup,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@motiadev/ui'
import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Header } from './components/header/header'
import { analytics } from './lib/analytics'
import { AppTabsState, TabLocation, useAppTabsStore } from './stores/use-app-tabs-store'
import { useTabsStore } from './stores/use-tabs-store'

const topTabs = (state: AppTabsState) => state.tabs

export const SystemViewMode = () => {
  const tab = useTabsStore((state) => state.tab)
  const setTopTab = useTabsStore((state) => state.setTopTab)
  const setBottomTab = useTabsStore((state) => state.setBottomTab)

  const tabs = useAppTabsStore(useShallow(topTabs))

  const tabChangeCallbacks = useMemo<Record<TabLocation, (tab: string) => void>>(
    () => ({
      [TabLocation.TOP]: setTopTab,
      [TabLocation.BOTTOM]: setBottomTab,
    }),
    [setTopTab, setBottomTab],
  )

  const onTabChange = useCallback(
    (location: TabLocation) => (newTab: string) => {
      analytics.track(`${location} tab changed`, { [`new.${location}`]: newTab, tab })
      tabChangeCallbacks[location](newTab)
    },
    [tabChangeCallbacks, tab],
  )

  return (
    <div className="grid grid-rows-[auto_1fr] grid-cols-[1fr_auto] bg-background text-foreground h-screen">
      <div className="col-span-2">
        <Header />
      </div>
      <main className="m-2 overflow-hidden" role="main">
        <CollapsiblePanelGroup
          autoSaveId="app-panel"
          direction="vertical"
          className="gap-1 h-full"
          aria-label="Workbench panels"
        >
          <CollapsiblePanel
            id="top-panel"
            variant={'tabs'}
            defaultTab={tab.top}
            onTabChange={onTabChange(TabLocation.TOP)}
            header={
              <TabsList>
                {tabs[TabLocation.TOP].map((tab) => {
                  const LabelComponent = tab.tabLabel
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      data-testid={`${tab.id.toLowerCase()}-link`}
                      className="cursor-pointer"
                    >
                      <LabelComponent />
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            }
          >
            {tabs[TabLocation.TOP].map((tab) => {
              const Element = tab.content
              return (
                <TabsContent key={tab.id} value={tab.id} className="h-full">
                  <Element />
                </TabsContent>
              )
            })}
          </CollapsiblePanel>
          <CollapsiblePanel
            id="bottom-panel"
            variant={'tabs'}
            defaultTab={tab.bottom}
            onTabChange={onTabChange(TabLocation.BOTTOM)}
            header={
              <TabsList>
                {tabs[TabLocation.BOTTOM].map((tab) => {
                  const LabelComponent = tab.tabLabel
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      data-testid={`${tab.id.toLowerCase()}-link`}
                      className="cursor-pointer"
                    >
                      <LabelComponent />
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            }
          >
            {tabs[TabLocation.BOTTOM].map((tab) => {
              const Element = tab.content
              return (
                <TabsContent key={tab.id} value={tab.id} className="h-full">
                  <Element />
                </TabsContent>
              )
            })}
          </CollapsiblePanel>
        </CollapsiblePanelGroup>
      </main>
      <div id={APP_SIDEBAR_CONTAINER_ID} />
    </div>
  )
}
