import { FC, useMemo } from 'react'
import { FlowPage } from './components/flow/flow-page'
import { FlowTabMenuItem } from './components/flow/flow-tab-menu-item'
import { TracingTabLabel } from './components/observability/trace-tab-label'
import { TracesPage } from './components/observability/traces-page'
import { registerPluginTabs } from './lib/plugins'
import { getViewModeFromURL, ViewMode } from './lib/utils'
import { ProjectViewMode } from './project-view-mode'
import { AppTab, setAppTabs, TabLocation } from './stores/use-app-tabs-store'
import { SystemViewMode } from './system-view-mode'

const TAB_IDS = {
  FLOW: 'flow',
  TRACING: 'tracing',
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

  const bottomTabs: AppTab[] = [
    {
      id: TAB_IDS.TRACING,
      tabLabel: TracingTabLabel,
      content: TracesPage,
    },
  ]

  setAppTabs(TabLocation.TOP, topTabs)
  setAppTabs(TabLocation.BOTTOM, bottomTabs)
}

registerDefaultTabs()
registerPluginTabs()

export const App: FC = () => {
  const viewMode = useMemo<ViewMode>(getViewModeFromURL, [])

  const ViewComponent = viewMode === 'project' ? ProjectViewMode : SystemViewMode

  return <ViewComponent />
}
