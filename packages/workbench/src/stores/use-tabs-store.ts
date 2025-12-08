import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { motiaAnalytics } from '../lib/motia-analytics'

interface TabsState {
  tab: Record<string, string>
  setTopTab: (tab: string) => void
  setBottomTab: (tab: string) => void
}

export const useTabsStore = create(
  persist<TabsState>(
    (set, get) => ({
      tab: {
        top: 'flow',
        bottom: 'tracing',
      },
      setTopTab: (tab) => {
        const currentTab = get().tab
        motiaAnalytics.track('Top panel tab changed', { 'new.top': tab, tab: currentTab })
        set((state) => ({ tab: { ...state.tab, top: tab } }))
      },
      setBottomTab: (tab) => {
        const currentTab = get().tab
        motiaAnalytics.track('Bottom panel tab changed', { 'new.bottom': tab, tab: currentTab })
        set((state) => ({ tab: { ...state.tab, bottom: tab } }))
      },
    }),
    {
      name: 'motia-tabs-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
