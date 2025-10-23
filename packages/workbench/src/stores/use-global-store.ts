import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type UseGlobalStore = {
  selectedEndpointId?: string
  selectEndpointId: (endpointId?: string) => void
}

const select = (id: string | undefined, name: keyof UseGlobalStore) => (state: UseGlobalStore) => {
  return id ? (state[name] === id ? state : { ...state, [name]: id }) : { ...state, [name]: undefined }
}

export const useGlobalStore = create(
  persist<UseGlobalStore>(
    (set) => ({
      selectedEndpointId: undefined,
      selectEndpointId: (endpointId) => set(select(endpointId, 'selectedEndpointId')),
    }),
    {
      name: 'motia-global-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
