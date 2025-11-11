import { type FC, memo, useEffect, useMemo } from 'react'
import { FlowPage } from './components/flow/flow-page'
import { FlowTabMenuItem } from './components/flow/flow-tab-menu-item'
import { registerPluginTabs } from './lib/plugins'
import { getViewModeFromURL, type ViewMode } from './lib/utils'
import { ProjectViewMode } from './project-view-mode'
import { type AppTab, TabLocation, useAppTabsStore } from './stores/use-app-tabs-store'
import { SystemViewMode } from './system-view-mode'

const TAB_IDS = {
  FLOW: 'flow',
  LOGS: 'logs',
} as const

const topTabs: AppTab[] = [
  {
    id: TAB_IDS.FLOW,
    tabLabel: FlowTabMenuItem,
    content: FlowPage,
  },
]

export const App: FC = memo(() => {
  const setTabs = useAppTabsStore((state) => state.setTabs)
  const addTab = useAppTabsStore((state) => state.addTab)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTabs(TabLocation.TOP, topTabs)
      registerPluginTabs(addTab)
    }, 10)
    return () => clearTimeout(timeout)
  }, [setTabs, addTab])

  const viewMode = useMemo<ViewMode>(getViewModeFromURL, [])

  const ViewComponent = viewMode === 'project' ? ProjectViewMode : SystemViewMode

  return <ViewComponent />
})
App.displayName = 'App'
