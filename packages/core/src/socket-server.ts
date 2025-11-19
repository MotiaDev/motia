import type { Server } from 'http'
import { type WebSocket, Server as WsServer } from 'ws'
import { globalLogger } from './logger'
import {
  type BaseMessage,
  type EventMessage,
  getRoom,
  type JoinMessage,
  sendAccessDenied,
  sendError,
} from './socket-server/helpers'
import type { StreamAuthRequest } from './types/app-config-types'

type Message = { type: 'join' | 'leave'; data: JoinMessage }

type Props = {
  server: Server
  onJoin: <TData>(streamName: string, groupId: string, id: string) => Promise<TData>
  onJoinGroup: <TData>(streamName: string, groupId: string) => Promise<TData[] | undefined>
  authenticate?: (request: StreamAuthRequest) => Promise<unknown | null> | unknown | null
  authorize?: (
    subscription: { streamName: string; groupId: string; id?: string },
    authContext?: unknown,
  ) => Promise<boolean> | boolean
}

const AUTH_ERROR_CODE = 401
export const createSocketServer = ({ server, onJoin, onJoinGroup, authenticate, authorize }: Props) => {
  const socketServer = new WsServer({
    server,
    verifyClient: async (info, callback) => {
      if (authenticate) {
        try {
          const authRequest: StreamAuthRequest = {
            headers: info.req.headers,
            url: info.req.url,
          }
          info.req.authContext = await authenticate(authRequest)
          callback(true)
        } catch {
          globalLogger.debug('[Socket Server] Authentication failed')
          callback(false, AUTH_ERROR_CODE, 'Authentication failed')
        }
      } else {
        callback(true)
      }
    },
  })
  const rooms: Record<string, Map<string, WebSocket>> = {}
  const subscriptions: Map<WebSocket, Set<[string, string]>> = new Map()
  const authContexts: Map<WebSocket, unknown> = new Map()

  const isAuthorized = async (socket: WebSocket, data: BaseMessage): Promise<boolean> => {
    if (!authorize) {
      return true
    }

    try {
      const authContext = authContexts.get(socket)
      const result = await authorize(data, authContext)
      return result !== false
    } catch (error) {
      sendError(socket, data, error as Error)
      globalLogger.error('[Socket Server] Failed to authorize stream subscription')
      return false
    }
  }

  socketServer.on('connection', async (socket, request) => {
    authContexts.set(socket, request.authContext)

    subscriptions.set(socket, new Set())

    socket.on('message', async (payload: Buffer) => {
      const message: Message = JSON.parse(payload.toString())

      if (message.type === 'join') {
        const authorized = await isAuthorized(socket, message.data)

        if (!authorized) {
          sendAccessDenied(socket, message.data)
          return
        }

        const room = getRoom(message.data)

        if (!rooms[room]) {
          rooms[room] = new Map()
        }

        if (message.data.id) {
          const item = await onJoin(message.data.streamName, message.data.groupId, message.data.id)

          if (item) {
            const resultMessage: EventMessage<typeof item> = {
              timestamp: Date.now(),
              streamName: message.data.streamName,
              groupId: message.data.groupId,
              id: message.data.id,
              event: { type: 'sync', data: item },
            }

            socket.send(JSON.stringify(resultMessage))
          }
        } else {
          const items = await onJoinGroup(message.data.streamName, message.data.groupId)

          if (items) {
            const resultMessage: EventMessage<typeof items> = {
              timestamp: Date.now(),
              streamName: message.data.streamName,
              groupId: message.data.groupId,
              event: { type: 'sync', data: items },
            }

            socket.send(JSON.stringify(resultMessage))
          }
        }

        rooms[room].set(message.data.subscriptionId, socket)
        subscriptions.get(socket)?.add([room, message.data.subscriptionId])
      } else if (message.type === 'leave') {
        const room = getRoom(message.data)

        if (rooms[room]) {
          rooms[room].delete(message.data.subscriptionId)
        }
      }
    })

    socket.on('close', () => {
      subscriptions.get(socket)?.forEach(([room, subscriptionId]) => {
        rooms[room]?.delete(subscriptionId)
      })
      subscriptions.delete(socket)
      authContexts.delete(socket)
    })
  })

  const pushEvent = <TData>(message: Omit<EventMessage<TData>, 'timestamp'>) => {
    const { groupId, streamName, id } = message
    const groupRoom = getRoom({ streamName, groupId })
    const eventMessage = JSON.stringify({ timestamp: Date.now(), ...message })

    if (rooms[groupRoom]) {
      rooms[groupRoom].forEach((socket) => {
        socket.send(eventMessage)
      })
    }

    if (id) {
      const itemRoom = getRoom({ groupId, streamName, id })

      if (rooms[itemRoom]) {
        rooms[itemRoom].forEach((socket) => {
          socket.send(eventMessage)
        })
      }
    }
  }

  return { pushEvent, socketServer }
}
