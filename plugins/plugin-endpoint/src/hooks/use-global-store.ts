import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type UseGlobalStore = {
  selectedEndpointId?: string
  selectEndpointId: (endpointId?: string) => void
  selectedTraceGroupId?: string
  selectTraceGroupId: (traceGroupId?: string) => void
  selectedTraceId?: string
  selectTraceId: (traceId?: string) => void
  selectedStateId?: string
  selectStateId: (stateId?: string) => void
  selectedLogId?: string
  selectLogId: (logId?: string) => void
}

const select = (id: string | undefined, name: keyof UseGlobalStore) => (state: UseGlobalStore) => {
  return id ? (state[name] === id ? state : { ...state, [name]: id }) : { ...state, [name]: undefined }
}

export const useGlobalStore = create(
  persist<UseGlobalStore>(
    (set) => ({
      selectedEndpointId: undefined,
      selectEndpointId: (endpointId) => set(select(endpointId, 'selectedEndpointId')),
      selectedTraceGroupId: undefined,
      selectTraceGroupId: (traceGroupId) => set(select(traceGroupId, 'selectedTraceGroupId')),
      selectedTraceId: undefined,
      selectTraceId: (traceId) => set(select(traceId, 'selectedTraceId')),
      selectedStateId: undefined,
      selectStateId: (stateId) => set(select(stateId, 'selectedStateId')),
      selectedLogId: undefined,
      selectLogId: (logId) => set(select(logId, 'selectedLogId')),
    }),
    {
      name: 'motia-global-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
