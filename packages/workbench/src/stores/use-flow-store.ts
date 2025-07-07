import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type UseFlowStore = {
  selectedFlowId?: string
  selectFlowId: (flowId: string) => void
  flows: string[]
  setFlows: (flows: string[]) => void
}

export const useFlowStore = create(
  persist<UseFlowStore>(
    (set) => ({
      flows: [],
      setFlows: (flows) => set({ flows }),
      selectFlowId: (flowId) =>
        set((state) => {
          if (state.selectedFlowId === flowId) {
            return state
          }
          return { selectedFlowId: flowId }
        }),
    }),
    {
      name: 'motia-flow-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
