export type ConnectionState = 'disconnected' | 'connecting' | 'connected'
export type LogLevel = 'info' | 'warn' | 'error'
export type StreamName = 'rbac_message' | 'rbac_message_python'

export type MessageStreamItem = {
  id: string
  from?: string
  status?: string
  message?: string
  updatedAt?: number
  createdAt?: number
}

export type ActiveConnection = {
  address: string
  groupId: string
}

export type StreamError = {
  code: string
  message: string
}

export type StreamBridgeProps = {
  streamName: string
  groupId: string
  onMessagesChange: (items: MessageStreamItem[]) => void
  onLog: (message: string, level?: LogLevel) => void
  onConnected: () => void
}
