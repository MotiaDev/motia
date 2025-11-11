import { CollapsiblePanel, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { memo, useId } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { type AppTabsState, TabLocation, useAppTabsStore } from '../stores/use-app-tabs-store'
import { useTabsStore } from '../stores/use-tabs-store'

const bottomTabsSelector = (state: AppTabsState) => state.tabs[TabLocation.BOTTOM]

export const BottomPanel = memo(() => {
  const defaultTab = useTabsStore((state) => state.tab.bottom)
  const setBottomTab = useTabsStore((state) => state.setBottomTab)
  const tabs = useAppTabsStore(useShallow(bottomTabsSelector))

  const bottomPanelId = useId()

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
          <Element />
        </TabsContent>
      ))}
    </CollapsiblePanel>
  )
})
BottomPanel.displayName = 'BottomPanel'
