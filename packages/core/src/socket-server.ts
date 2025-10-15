import type http from 'http'
import { type WebSocket, Server as WsServer } from 'ws'

type BaseMessage = { streamName: string; groupId: string; id?: string }
type JoinMessage = BaseMessage & { subscriptionId: string }
type StreamEvent<TData> =
  | { type: 'sync'; data: TData }
  | { type: 'create'; data: TData }
  | { type: 'update'; data: TData }
  | { type: 'delete'; data: TData }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'event'; event: { type: string; data: any } }
type EventMessage<TData> = BaseMessage & { timestamp: number; event: StreamEvent<TData> }

type Message = { type: 'join' | 'leave'; data: JoinMessage }

type Props = {
  server: http.Server
  onJoin: <TData>(streamName: string, groupId: string, id: string) => Promise<TData>
  onJoinGroup: <TData>(streamName: string, groupId: string) => Promise<TData[] | undefined>
}

export const createSocketServer = ({ server, onJoin, onJoinGroup }: Props) => {
  const socketServer = new WsServer({ server })
  const rooms: Record<string, Map<string, WebSocket>> = {}
  const subscriptions: Map<WebSocket, Set<[string, string]>> = new Map()

  const getRoom = (message: BaseMessage): string => {
    return message.id ? `${message.streamName}:id:${message.id}` : `${message.streamName}:group-id:${message.groupId}`
  }

  socketServer.on('connection', (socket) => {
    subscriptions.set(socket, new Set())

    socket.on('message', async (payload: Buffer) => {
      const message: Message = JSON.parse(payload.toString())

      if (message.type === 'join') {
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
    })
  })

  const pushEvent = <TData>(message: Omit<EventMessage<TData>, 'timestamp'>) => {
    const { groupId, streamName, id } = message
    const groupRoom = getRoom({ streamName, groupId })
    const eventMessage = JSON.stringify({ timestamp: Date.now(), ...message })

    if (rooms[groupRoom]) {
      rooms[groupRoom].forEach((socket) => socket.send(eventMessage))
    }

    if (id) {
      const itemRoom = getRoom({ groupId, streamName, id })

      if (rooms[itemRoom]) {
        rooms[itemRoom].forEach((socket) => socket.send(eventMessage))
      }
    }
  }

  return { pushEvent, socketServer }
}
