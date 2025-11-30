import { jest } from '@jest/globals'
import http from 'http'
import WebSocket from 'ws'
import { createSocketServer } from '../socket-server'

type ServerEventMessage = {
  event: {
    type: string
    data?: unknown
    event?: {
      type: string
      data?: unknown
    }
  }
  [key: string]: unknown
}

const waitForOpen = (ws: WebSocket): Promise<void> => {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve())
    ws.once('error', (error) => reject(error))
  })
}

const waitForMessage = (ws: WebSocket): Promise<ServerEventMessage> => {
  return new Promise((resolve, reject) => {
    ws.once('message', (data) => {
      try {
        resolve(JSON.parse(data.toString()))
      } catch (error) {
        reject(error)
      }
    })
    ws.once('error', (error) => reject(error))
  })
}

describe('createSocketServer authentication', () => {
  let httpServer: http.Server
  let socketServer: ReturnType<typeof createSocketServer>['socketServer']
  let port: number

  beforeEach(async () => {
    httpServer = http.createServer()
    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const address = httpServer.address()

    if (!address || typeof address === 'string') {
      throw new Error('Invalid test server address')
    }

    port = address.port
  })

  afterEach(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    socketServer?.close()
  })

  it('passes auth context to join handlers when token is provided', async () => {
    const authenticate = jest.fn().mockResolvedValue({ userId: 'user-1' })
    const onJoin = jest.fn().mockResolvedValue({ id: 'item-1', value: 'ok' })
    const onJoinGroup = jest.fn()

    const created = createSocketServer({
      server: httpServer,
      authenticate,
      authorize: () => true,
      onJoin,
      onJoinGroup,
    })
    socketServer = created.socketServer

    const ws = new WebSocket(`ws://127.0.0.1:${port}?authToken=my-token`)
    await waitForOpen(ws)

    ws.send(
      JSON.stringify({
        type: 'join',
        data: { streamName: 'test-stream', groupId: 'group-1', id: 'item-1', subscriptionId: 'sub-1' },
      }),
    )

    const message = await waitForMessage(ws)

    expect(authenticate).toHaveBeenCalledWith(expect.objectContaining({ url: '/?authToken=my-token' }))
    expect(onJoin).toHaveBeenCalledWith('test-stream', 'group-1', 'item-1')
    expect(message.event.type).toBe('sync')

    ws.close()
  })

  it('rejects connection when authenticate throws', async () => {
    const authenticate = jest.fn().mockRejectedValue(new Error('bad token'))
    const onJoin = jest.fn()
    const onJoinGroup = jest.fn()

    const created = createSocketServer({
      server: httpServer,
      authenticate,
      authorize: () => true,
      onJoin,
      onJoinGroup,
    })
    socketServer = created.socketServer

    const ws = new WebSocket(`ws://127.0.0.1:${port}?authToken=bad-token`)

    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => reject(new Error('connection should not open')))
      ws.once('unexpected-response', (_request, response) => {
        expect(response.statusCode).toBe(401)
        resolve()
      })
      ws.once('error', (error) => {
        expect(error).toBeInstanceOf(Error)
        resolve()
      })
    })

    expect(authenticate).toHaveBeenCalled()
    expect(onJoin).not.toHaveBeenCalled()
    expect(onJoinGroup).not.toHaveBeenCalled()

    ws.terminate()
  })

  it('denies access when authorize returns false', async () => {
    const authenticate = jest.fn().mockResolvedValue({ userId: 'user-2' })
    const authorize = jest.fn().mockResolvedValue(false)
    const onJoin = jest.fn()
    const onJoinGroup = jest.fn()

    const created = createSocketServer({
      server: httpServer,
      authenticate,
      authorize,
      onJoin,
      onJoinGroup,
    })
    socketServer = created.socketServer

    const ws = new WebSocket(`ws://127.0.0.1:${port}?authToken=denied`)
    await waitForOpen(ws)

    ws.send(
      JSON.stringify({
        type: 'join',
        data: { streamName: 'restricted', groupId: 'group-1', id: 'item-1', subscriptionId: 'sub-1' },
      }),
    )

    const message = await waitForMessage(ws)

    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({ streamName: 'restricted', groupId: 'group-1', id: 'item-1' }),
      { userId: 'user-2' },
    )
    expect(onJoin).not.toHaveBeenCalled()
    expect(message.event.type).toBe('event')
    expect(message.event.event?.type).toBe('error')

    ws.close()
  })

  it('sends error event when authorize throws', async () => {
    const authenticate = jest.fn().mockResolvedValue({ userId: 'user-3' })
    const authorize = jest.fn().mockImplementation(() => {
      throw new Error('boom')
    })
    const onJoin = jest.fn()
    const onJoinGroup = jest.fn()

    const created = createSocketServer({
      server: httpServer,
      authenticate,
      authorize,
      onJoin,
      onJoinGroup,
    })
    socketServer = created.socketServer

    const ws = new WebSocket(`ws://127.0.0.1:${port}?authToken=error`)
    await waitForOpen(ws)

    ws.send(
      JSON.stringify({
        type: 'join',
        data: { streamName: 'test-stream', groupId: 'group-err', id: 'item-err', subscriptionId: 'sub-err' },
      }),
    )

    const message = await waitForMessage(ws)

    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({ streamName: 'test-stream', groupId: 'group-err', id: 'item-err' }),
      { userId: 'user-3' },
    )
    expect(onJoin).not.toHaveBeenCalled()
    expect(message.event.type).toBe('event')
    expect(message.event.event?.type).toBe('error')

    ws.close()
  })

  it('returns sync payload from onJoinGroup when joining without id', async () => {
    const authenticate = jest.fn()
    const onJoin = jest.fn()
    const groupItems = [
      { id: 'item-1', value: 'foo' },
      { id: 'item-2', value: 'bar' },
    ]
    const onJoinGroup = jest.fn().mockResolvedValue(groupItems)

    const created = createSocketServer({
      server: httpServer,
      authenticate,
      authorize: () => true,
      onJoin,
      onJoinGroup,
    })
    socketServer = created.socketServer

    const ws = new WebSocket(`ws://127.0.0.1:${port}`)
    await waitForOpen(ws)

    ws.send(
      JSON.stringify({
        type: 'join',
        data: { streamName: 'group-stream', groupId: 'group-42', subscriptionId: 'sub-group' },
      }),
    )

    const message = await waitForMessage(ws)

    expect(onJoin).not.toHaveBeenCalled()
    expect(onJoinGroup).toHaveBeenCalledWith('group-stream', 'group-42')
    expect(message.event.type).toBe('sync')
    expect(message.event.data).toEqual(groupItems)

    ws.close()
  })
})
