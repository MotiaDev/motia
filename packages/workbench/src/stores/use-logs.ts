import { useSyncExternalStore, useCallback } from 'react'

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
  unreadLogsCount: number
  setUnreadLogsCount: (count: number) => void
}

const listeners = new Set<() => void>()

let currentLogs: Log[] = []
let currentUnreadLogsCount = 0
let memoizedSnapshot: LogsState

const updateMemoizedSnapshot = () => {
  memoizedSnapshot = {
    logs: currentLogs,
    unreadLogsCount: currentUnreadLogsCount,
    addLog: storeActions.addLog,
    resetLogs: storeActions.resetLogs,
    setUnreadLogsCount: storeActions.setUnreadLogsCount,
  }
}

const notify = () => {
  listeners.forEach((listener) => listener())
}

const storeActions = {
  addLog: (log: Log) => {
    currentLogs = [log, ...currentLogs]
    currentUnreadLogsCount += 1
    updateMemoizedSnapshot()
    notify()
  },
  resetLogs: () => {
    if (currentLogs.length === 0 && currentUnreadLogsCount === 0) {
      return
    }
    currentLogs = []
    currentUnreadLogsCount = 0
    updateMemoizedSnapshot()
    notify()
  },
  setUnreadLogsCount: (count: number) => {
    if (currentUnreadLogsCount === count) {
      return
    }
    currentUnreadLogsCount = count
    updateMemoizedSnapshot()
    notify()
  },
}

updateMemoizedSnapshot()

// Stable subscribe function so React doesn't unnecessarily tear down the subscription
const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function useLogs<SelectorOutput = LogsState>(
  selector: (state: LogsState) => SelectorOutput = (state) => state as unknown as SelectorOutput,
): SelectorOutput {
  const getSnapshot = useCallback(() => selector(memoizedSnapshot), [selector])

  return useSyncExternalStore(subscribe, getSnapshot)
}
