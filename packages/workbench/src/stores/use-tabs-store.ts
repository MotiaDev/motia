import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface TabsState {
  tab: Record<string, string>
  setTopTab: (tab: string) => void
  setBottomTab: (tab: string) => void
}

export const useTabsStore = create(
  persist<TabsState>(
    (set) => ({
      tab: {
        top: 'flow',
        bottom: 'tracing',
      },
      setTopTab: (tab) => {
        set((state) => ({ tab: { ...state.tab, top: tab } }))
      },
      setBottomTab: (tab) => set((state) => ({ tab: { ...state.tab, bottom: tab } })),
    }),
    {
      name: 'motia-tabs-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
