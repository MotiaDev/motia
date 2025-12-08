import type { WebSocket } from 'ws'

export type BaseMessage = { streamName: string; groupId: string; id?: string }
export type JoinMessage = BaseMessage & { subscriptionId: string }
export type StreamEvent<TData> =
  | { type: 'sync'; data: TData }
  | { type: 'create'; data: TData }
  | { type: 'update'; data: TData }
  | { type: 'delete'; data: TData }
  | { type: 'event'; event: { type: string; data: unknown } }
export type EventMessage<TData> = BaseMessage & { timestamp: number; event: StreamEvent<TData> }

export const ACCESS_DENIED_CODE = 'STREAM_ACCESS_DENIED'

export const getRoom = (message: BaseMessage): string => {
  return message.id ? `${message.streamName}:id:${message.id}` : `${message.streamName}:group-id:${message.groupId}`
}

export const createErrorMessage = (data: BaseMessage, error: Error) => {
  return {
    timestamp: Date.now(),
    streamName: data.streamName,
    groupId: data.groupId,
    id: data.id,
    event: { type: 'event', event: { type: 'error', data: { code: ACCESS_DENIED_CODE, message: error.message } } },
  }
}

export const sendAccessDenied = (socket: WebSocket, data: BaseMessage) => {
  const resultMessage = createErrorMessage(data, new Error('Access denied'))
  socket.send(JSON.stringify(resultMessage))
}

export const sendError = (socket: WebSocket, data: BaseMessage, error: Error) => {
  const resultMessage = createErrorMessage(data, error)
  socket.send(JSON.stringify(resultMessage))
}
