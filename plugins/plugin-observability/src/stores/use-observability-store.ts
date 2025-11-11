import { create } from 'zustand'

export type ObservabilityState = {
  selectedTraceGroupId: string
  selectedTraceId?: string
  search: string
  selectTraceGroupId: (groupId?: string) => void
  selectTraceId: (traceId?: string) => void
  setSearch: (search: string) => void
  clearTraces: () => void
}

export const useObservabilityStore = create<ObservabilityState>()((set) => ({
  selectedTraceGroupId: '',
  selectedTraceId: undefined,
  search: '',
  selectTraceGroupId: (groupId) => set({ selectedTraceGroupId: groupId }),
  selectTraceId: (traceId) => set({ selectedTraceId: traceId }),
  setSearch: (search) => set({ search }),
  clearTraces: () => {
    fetch('/__motia/trace/clear', { method: 'POST' })
  },
}))
