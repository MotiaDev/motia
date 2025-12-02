import { create } from 'zustand'
import type { ActiveConnection, ConnectionState, LogLevel, MessageStreamItem, StreamError, StreamName } from './types'
import { LOG_LIMIT } from './utils'

interface StreamRbacState {
  // Connection Settings
  wsUrl: string
  groupId: string
  authToken: 'token-nodejs' | 'token-python'
  streamName: StreamName

  // Connection State
  connectionState: ConnectionState
  activeConnection: ActiveConnection | null

  // Data
  messages: MessageStreamItem[]

  // Prompt Form
  promptText: string
  isPrompting: boolean

  // Logs
  logEntries: string[]

  // Error State
  error: StreamError | null

  // Actions
  setWsUrl: (url: string) => void
  setGroupId: (id: string) => void
  setAuthToken: (token: string) => void
  setStreamName: (name: StreamName) => void
  setConnectionState: (state: ConnectionState) => void
  setActiveConnection: (connection: ActiveConnection | null) => void
  setMessages: (messages: MessageStreamItem[]) => void
  setPromptText: (text: string) => void
  setIsPrompting: (isPrompting: boolean) => void
  appendLog: (message: string, level?: LogLevel) => void
  clearLogs: () => void
  setError: (error: StreamError | null) => void
  clearError: () => void
}

export const useStreamRbacStore = create<StreamRbacState>((set) => ({
  // Initial State
  wsUrl: 'ws://localhost:3000',
  groupId: 'demo-thread' as const,
  authToken: 'token-nodejs' as const,
  streamName: 'rbac_message' as const,
  connectionState: 'disconnected' as const,
  activeConnection: null,
  messages: [],
  promptText: '',
  isPrompting: false,
  logEntries: [],
  error: null,

  // Actions
  setWsUrl: (wsUrl) => set({ wsUrl }),
  setGroupId: (groupId) => set({ groupId }),
  setAuthToken: (authToken) => set({ authToken: authToken as 'token-nodejs' | 'token-python' }),
  setStreamName: (streamName) => set({ streamName }),

  setConnectionState: (connectionState) => set({ connectionState }),
  setActiveConnection: (activeConnection) => set({ activeConnection }),

  setMessages: (messages) => set({ messages }),

  setPromptText: (promptText) => set({ promptText }),
  setIsPrompting: (isPrompting) => set({ isPrompting }),

  appendLog: (message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const entry = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    set((state) => {
      const newLogs = [entry, ...state.logEntries]
      if (newLogs.length > LOG_LIMIT) {
        return { logEntries: newLogs.slice(0, LOG_LIMIT) }
      }
      return { logEntries: newLogs }
    })
  },

  clearLogs: () => set({ logEntries: [] }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
