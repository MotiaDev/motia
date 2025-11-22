import { create } from 'zustand'
import type { Log } from '../types/log'

export type LogsState = {
  logs: Log[]
  selectedLogId?: string
  addLog: (log: Log) => void
  setLogs: (logs: Log[]) => void
  resetLogs: () => void
  selectLogId: (logId?: string) => void
}

export const useLogsStore = create<LogsState>()((set) => ({
  logs: [],
  selectedLogId: undefined,
  addLog: (log) =>
    set((state) => {
      if (state.logs.find((l) => l.id === log.id)) {
        return state
      }
      return {
        logs: [log, ...state.logs],
      }
    }),
  setLogs: (logs) =>
    set({
      logs: [...logs].reverse(),
    }),
  resetLogs: () => {
    set({ logs: [] })
  },
  selectLogId: (logId) => set({ selectedLogId: logId }),
}))
