import { create } from 'zustand'
import type { Log } from '../types/log'

export type LogsState = {
  logs: Log[]
  selectedLogId?: string
  addLog: (log: Log) => void
  resetLogs: () => void
  selectLogId: (logId?: string) => void
}

export const useLogsStore = create<LogsState>()((set) => ({
  logs: [],
  selectedLogId: undefined,
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs],
    })),
  resetLogs: () => {
    set({ logs: [] })
  },
  selectLogId: (logId) => set({ selectedLogId: logId }),
}))
