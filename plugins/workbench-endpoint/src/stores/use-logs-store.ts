import { create } from 'zustand'

export type Log = {
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any
}

export type LogsState = {
  logs: Log[]
  addLog: (log: Log) => void
  resetLogs: () => void
}

export const useLogsStore = create<LogsState>()((set) => ({
  logs: [],
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs],
    })),
  resetLogs: () => {
    set({ logs: [] })
  },
}))
