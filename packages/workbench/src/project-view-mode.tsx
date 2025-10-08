import { AppTabsState, TabLocation, useAppTabsStore } from './stores/use-app-tabs-store'
import { APP_SIDEBAR_CONTAINER_ID, Panel } from '@motiadev/ui'
import { useShallow } from 'zustand/react/shallow'

const topTabs = (state: AppTabsState) => state.tabs[TabLocation.TOP]

export const ProjectViewMode = () => {
  const tabs = useAppTabsStore(useShallow(topTabs))

  return (
    <div className="grid grid-rows-1 grid-cols-[1fr_auto] bg-background text-foreground h-screen ">
      <main className="m-2 overflow-hidden" role="main">
        <Panel
          contentClassName={'p-0'}
          tabs={tabs.map((tab) => {
            const Element = tab.content
            const LabelComponent = tab.tabLabel
            return {
              label: tab.id,
              labelComponent: <LabelComponent />,
              content: <Element />,
              'data-testid': tab.id,
            }
          })}
        />
      </main>
      <div id={APP_SIDEBAR_CONTAINER_ID} />
    </div>
  )
}
