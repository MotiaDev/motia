import { type FC, useEffect, useMemo } from 'react'
import { FlowPage } from './components/flow/flow-page'
import { FlowTabMenuItem } from './components/flow/flow-tab-menu-item'
import { registerPluginTabs } from './lib/plugins'
import { getViewModeFromURL, type ViewMode } from './lib/utils'
import { ProjectViewMode } from './project-view-mode'
import { type AppTab, setAppTabs, TabLocation } from './stores/use-app-tabs-store'
import { SystemViewMode } from './system-view-mode'

const TAB_IDS = {
  FLOW: 'flow',
  LOGS: 'logs',
} as const

const registerDefaultTabs = (): void => {
  const topTabs: AppTab[] = [
    {
      id: TAB_IDS.FLOW,
      tabLabel: FlowTabMenuItem,
      content: FlowPage,
    },
  ]

  const bottomTabs: AppTab[] = []

  setAppTabs(TabLocation.TOP, topTabs)
  setAppTabs(TabLocation.BOTTOM, bottomTabs)
}

export const App: FC = () => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('registering default tabs')
      registerDefaultTabs()
      console.log('registering plugin tabs')
      registerPluginTabs()
      console.log('registered tabs')
    }, 10)
    return () => clearTimeout(timeout)
  }, [])

  const viewMode = useMemo<ViewMode>(getViewModeFromURL, [])

  const ViewComponent = viewMode === 'project' ? ProjectViewMode : SystemViewMode

  return <ViewComponent />
}
