import { create } from 'zustand'
import type { Trace, TraceGroup } from '../types/observability'

export type ObservabilityState = {
  traceGroups: TraceGroup[]
  traces: Trace[]
  selectedTraceGroupId: string
  selectedTraceId?: string
  search: string
  setTraceGroups: (groups: TraceGroup[]) => void
  setTraces: (traces: Trace[]) => void
  selectTraceGroupId: (groupId?: string) => void
  selectTraceId: (traceId?: string) => void
  setSearch: (search: string) => void
  clearTraces: () => void
}

export const useObservabilityStore = create<ObservabilityState>()((set) => ({
  traceGroups: [],
  traces: [],
  selectedTraceGroupId: '',
  selectedTraceId: undefined,
  search: '',
  setTraceGroups: (groups: TraceGroup[]) => {
    const safeGroups = Array.isArray(groups) ? groups : []
    set({ traceGroups: safeGroups })
  },
  setTraces: (traces: Trace[]) => {
    const safeTraces = Array.isArray(traces) ? traces : []
    set({ traces: safeTraces })
  },
  selectTraceGroupId: (groupId) => set({ selectedTraceGroupId: groupId }),
  selectTraceId: (traceId) => set({ selectedTraceId: traceId }),
  setSearch: (search) => set({ search }),
  clearTraces: () => {
    fetch('/__motia/trace/clear', { method: 'POST' })
  },
}))
