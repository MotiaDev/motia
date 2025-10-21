import { create } from 'zustand'

export type ObservabilityState = {
  selectedTraceGroupId?: string
  selectedTraceId?: string
  selectTraceGroupId: (groupId?: string) => void
  selectTraceId: (traceId?: string) => void
}

export const useObservabilityStore = create<ObservabilityState>()((set) => ({
  selectedTraceGroupId: undefined,
  selectedTraceId: undefined,
  selectTraceGroupId: (groupId) => set({ selectedTraceGroupId: groupId }),
  selectTraceId: (traceId) => set({ selectedTraceId: traceId }),
}))
