import { create } from 'zustand'

export enum TabLocation {
  TOP = 'top',
  BOTTOM = 'bottom',
}

export type AppTab = {
  id: string
  tabLabel: React.ElementType
  content: React.ElementType
}

export interface AppTabsState {
  tabs: Record<TabLocation, AppTab[]>
  addTab: (position: TabLocation, tab: AppTab) => void
  setTabs: (position: TabLocation, tabs: AppTab[]) => void
  removeTab: (position: TabLocation, id: string) => void
}

const defaultTabs: Record<TabLocation, AppTab[]> = {
  [TabLocation.TOP]: [],
  [TabLocation.BOTTOM]: [],
}

export const useAppTabsStore = create<AppTabsState>((set) => ({
  tabs: defaultTabs,
  addTab: (position: TabLocation, tab: AppTab) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [position]: [...state.tabs[position], tab],
      },
    })),
  setTabs: (position: TabLocation, tabs: AppTab[]) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [position]: tabs,
      },
    })),
  removeTab: (position: TabLocation, id: string) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [position]: state.tabs[position].filter((tab) => tab.id !== id),
      },
    })),
}))

export const setAppTabs = (position: TabLocation, tabs: AppTab[]) => {
  useAppTabsStore.getState().setTabs(position, tabs)
}

export const addAppTab = (position: TabLocation, tab: AppTab) => {
  useAppTabsStore.getState().addTab(position, tab)
}
