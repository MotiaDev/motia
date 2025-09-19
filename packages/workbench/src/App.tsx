import { CollapsiblePanel, CollapsiblePanelGroup, Panel, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { analytics } from '@/lib/analytics'
import { ReactFlowProvider } from '@xyflow/react'
import { File, GanttChart, Link2, LogsIcon } from 'lucide-react'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { FlowPage } from './components/flow/flow-page'
import { FlowTabMenuItem } from './components/flow/flow-tab-menu-item'
import { Header } from './components/header/header'
import { LogsPage } from './components/logs/logs-page'
import { TracesPage } from './components/observability/traces-page'
import { APP_SIDEBAR_CONTAINER_ID } from '@motiadev/ui'
import { StatesPage } from './components/states/states-page'
import { useTabsStore } from './stores/use-tabs-store'
import { EndpointsPage } from '@motiadev/workbench-endpoint'

enum TabLocation {
  TOP = 'top',
  BOTTOM = 'bottom',
}

export const App: FC = () => {
  const tab = useTabsStore((state) => state.tab)
  const setTopTab = useTabsStore((state) => state.setTopTab)
  const setBottomTab = useTabsStore((state) => state.setBottomTab)
  const [viewMode, setViewMode] = useState<'project' | 'system'>('system')

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
  useEffect(() => {
    const url = new URL(window.location.href)
    const viewMode = url.searchParams.get('view-mode') as 'project' | 'system'
    if (viewMode) {
      setViewMode(viewMode)
    }
  }, [setViewMode])

  if (viewMode === 'project') {
    return (
      <div className="grid grid-rows-[auto_1fr] grid-cols-[1fr_auto] bg-background text-foreground h-screen ">
        <main className="m-2 overflow-hidden" role="main">
          <Panel
            tabs={[
              {
                label: 'Flow',
                labelComponent: <FlowTabMenuItem />,
                content: (
                  <ReactFlowProvider>
                    <div className="h-[calc(100vh-100px)] w-full">
                      <FlowPage />
                    </div>
                  </ReactFlowProvider>
                ),
              },
              {
                label: 'Endpoint',
                labelComponent: (
                  <>
                    <Link2 />
                    Endpoint
                  </>
                ),
                content: <EndpointsPage />,
              },
            ]}
          />
        </main>
        <div id={APP_SIDEBAR_CONTAINER_ID} />
      </div>
    )
  }

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
                <TabsTrigger value="flow" data-testid="flows-link">
                  <FlowTabMenuItem />
                </TabsTrigger>
                <TabsTrigger value="endpoint" data-testid="endpoints-link" className="cursor-pointer">
                  <Link2 />
                  Endpoint
                </TabsTrigger>
              </TabsList>
            }
          >
            <TabsContent value="flow" className="h-full" asChild>
              <ReactFlowProvider>
                <FlowPage />
              </ReactFlowProvider>
            </TabsContent>
            <TabsContent value="endpoint" asChild>
              <EndpointsPage />
            </TabsContent>
          </CollapsiblePanel>
          <CollapsiblePanel
            id="bottom-panel"
            variant={'tabs'}
            defaultTab={tab.bottom}
            onTabChange={onTabChange(TabLocation.BOTTOM)}
            header={
              <TabsList>
                <TabsTrigger value="tracing" data-testid="traces-link" className="cursor-pointer">
                  <GanttChart /> Tracing
                </TabsTrigger>
                <TabsTrigger value="logs" data-testid="logs-link" className="cursor-pointer">
                  <LogsIcon />
                  Logs
                </TabsTrigger>
                <TabsTrigger value="states" data-testid="states-link" className="cursor-pointer">
                  <File />
                  States
                </TabsTrigger>
              </TabsList>
            }
          >
            <TabsContent value="tracing" className="max-h-fit" asChild>
              <TracesPage />
            </TabsContent>
            <TabsContent value="logs" asChild>
              <LogsPage />
            </TabsContent>
            <TabsContent value="states" asChild>
              <StatesPage />
            </TabsContent>
          </CollapsiblePanel>
        </CollapsiblePanelGroup>
      </main>
      <div id={APP_SIDEBAR_CONTAINER_ID} />
    </div>
  )
}
