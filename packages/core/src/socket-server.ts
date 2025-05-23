import { WebSocket, Server as WsServer } from 'ws'
import http from 'http'

type BaseMessage = { streamName: string } & ({ id: string } | { groupId: string })
type JoinMessage = BaseMessage & { subscriptionId: string }
type StreamEvent<TData> =
  | { type: 'sync'; data: TData }
  | { type: 'create'; data: TData }
  | { type: 'update'; data: TData }
  | { type: 'delete'; data: TData }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'event'; event: { type: string; data: any } }
type EventMessage<TData> = BaseMessage & { event: StreamEvent<TData> }

type Message = { type: 'join' | 'leave'; data: JoinMessage }

type Props = {
  server: http.Server
  onJoin: <TData>(streamName: string, id: string) => Promise<TData>
  onJoinGroup: <TData>(streamName: string, groupId: string) => Promise<TData[] | undefined>
}

export const createSocketServer = ({ server, onJoin, onJoinGroup }: Props) => {
  const socketServer = new WsServer({ server })
  const rooms: Record<string, Map<string, WebSocket>> = {}
  const subscriptions: Map<WebSocket, Set<[string, string]>> = new Map()

  const getRoom = (message: BaseMessage): string => {
    return 'id' in message
      ? `${message.streamName}:id:${message.id}`
      : `${message.streamName}:group-id:${message.groupId}`
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

        if ('id' in message.data) {
          const item = await onJoin(message.data.streamName, message.data.id)

          if (item) {
            const resultMessage: EventMessage<typeof item> = {
              streamName: message.data.streamName,
              id: message.data.id,
              event: { type: 'sync', data: item },
            }

            socket.send(JSON.stringify(resultMessage))
          }
        } else {
          const items = await onJoinGroup(message.data.streamName, message.data.groupId)

          if (items) {
            const resultMessage: EventMessage<typeof items> = {
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

  const pushEvent = <TData>(message: EventMessage<TData>) => {
    const room = getRoom(message)

    if (rooms[room]) {
      rooms[room].forEach((socket) => socket.send(JSON.stringify(message)))
    }
  }

  return { pushEvent, socketServer }
}
