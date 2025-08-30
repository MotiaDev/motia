# Real-time Applications

Build real-time features with WebSockets, Server-Sent Events, and Motia's streaming capabilities.

## WebSocket Integration

### Basic WebSocket Setup
```typescript
// steps/api/websocket/connect.step.ts
import { ApiRouteConfig, Handlers } from 'motia'
import { WebSocket } from 'ws'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'WebSocketConnect',
  method: 'GET',
  path: '/ws',
  middleware: [authMiddleware],
  websocket: true
}

export const handler: Handlers['WebSocketConnect'] = async (req, { state, streams, logger }) => {
  const userId = req.user.userId
  const ws = req.ws as WebSocket
  const connectionId = crypto.randomUUID()
  
  // Store connection
  await state.set('connections', connectionId, {
    userId,
    connectedAt: new Date().toISOString(),
    lastPing: Date.now()
  })
  
  // Subscribe to user's stream
  const userStream = streams[`user:${userId}`]
  const unsubscribe = userStream.subscribe((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'update',
        data
      }))
    }
  })
  
  // Handle messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      await handleWebSocketMessage(data, { userId, connectionId, state, streams })
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
    }
  })
  
  // Handle disconnect
  ws.on('close', async () => {
    unsubscribe()
    await state.delete('connections', connectionId)
    logger.info('WebSocket disconnected', { userId, connectionId })
  })
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    connectionId,
    userId
  }))
}

async function handleWebSocketMessage(data: any, ctx: any) {
  switch (data.type) {
    case 'ping':
      await ctx.state.set('connections', ctx.connectionId, {
        ...await ctx.state.get('connections', ctx.connectionId),
        lastPing: Date.now()
      })
      break
      
    case 'subscribe':
      // Subscribe to additional channels
      const stream = ctx.streams[data.channel]
      stream.subscribe((update) => {
        ws.send(JSON.stringify({
          type: 'channel_update',
          channel: data.channel,
          data: update
        }))
      })
      break
      
    case 'message':
      // Handle chat messages, etc
      await ctx.emit({
        topic: 'message.received',
        data: {
          userId: ctx.userId,
          content: data.content,
          timestamp: new Date().toISOString()
        }
      })
      break
  }
}
```

## Chat Application

### Chat Room Management
```typescript
// steps/api/chat/create-room.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateChatRoom',
  method: 'POST',
  path: '/chat/rooms',
  middleware: [authMiddleware],
  bodySchema: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    isPrivate: z.boolean().default(false),
    members: z.array(z.string()).optional()
  }),
  emits: ['chat.room.created']
}

export const handler = async (req, { emit, state }) => {
  const roomId = crypto.randomUUID()
  const room = {
    id: roomId,
    name: req.body.name,
    description: req.body.description,
    createdBy: req.user.userId,
    createdAt: new Date().toISOString(),
    isPrivate: req.body.isPrivate,
    members: [req.user.userId, ...(req.body.members || [])],
    lastActivity: new Date().toISOString()
  }
  
  // Store room
  await state.set('rooms', roomId, room)
  
  // Add room to each member's room list
  for (const memberId of room.members) {
    await state.set('user_rooms', `${memberId}:${roomId}`, { joinedAt: new Date().toISOString() })
  }
  
  // Create room stream
  await state.set('streams', `room:${roomId}`, { type: 'chat_room' })
  
  await emit({
    topic: 'chat.room.created',
    data: { roomId, createdBy: req.user.userId, members: room.members }
  })
  
  return { status: 201, body: room }
}
```

### Real-time Messaging
```typescript
// steps/api/chat/send-message.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'SendMessage',
  method: 'POST',
  path: '/chat/rooms/:roomId/messages',
  middleware: [authMiddleware],
  bodySchema: z.object({
    content: z.string().min(1).max(1000),
    type: z.enum(['text', 'image', 'file']).default('text'),
    metadata: z.record(z.any()).optional()
  }),
  emits: ['chat.message.sent']
}

export const handler = async (req, { emit, state, streams }) => {
  const { roomId } = req.pathParams
  const { content, type, metadata } = req.body
  const userId = req.user.userId
  
  // Verify membership
  const membership = await state.get('user_rooms', `${userId}:${roomId}`)
  if (!membership) {
    return { status: 403, body: { error: 'Not a member of this room' } }
  }
  
  const messageId = crypto.randomUUID()
  const message = {
    id: messageId,
    roomId,
    userId,
    content,
    type,
    metadata,
    createdAt: new Date().toISOString(),
    edited: false,
    reactions: {}
  }
  
  // Store message
  await state.set('messages', `${roomId}:${messageId}`, message)
  
  // Update room last activity
  const room = await state.get('rooms', roomId)
  room.lastActivity = new Date().toISOString()
  room.lastMessage = { messageId, content, userId }
  await state.set('rooms', roomId, room)
  
  // Broadcast to room members via stream
  const roomStream = streams[`room:${roomId}`]
  await roomStream.set('messages', messageId, {
    type: 'new_message',
    message,
    user: {
      id: userId,
      name: req.user.name,
      avatar: req.user.avatar
    }
  })
  
  // Emit for notifications
  await emit({
    topic: 'chat.message.sent',
    data: { roomId, messageId, userId, members: room.members }
  })
  
  return { status: 201, body: message }
}
```

### Typing Indicators
```typescript
// steps/events/typing-indicator.step.ts
export const config: EventConfig = {
  type: 'event',
  name: 'TypingIndicator',
  subscribes: ['chat.typing.start', 'chat.typing.stop'],
  input: z.object({
    roomId: z.string(),
    userId: z.string()
  })
}

export const handler = async (input, { streams }) => {
  const { roomId, userId } = input
  const roomStream = streams[`room:${roomId}`]
  
  if (input.topic === 'chat.typing.start') {
    await roomStream.set('typing', userId, {
      userId,
      startedAt: Date.now()
    }, 5) // 5 second TTL
  } else {
    await roomStream.delete('typing', userId)
  }
}
```

## Live Collaboration

### Document Collaboration
```typescript
// steps/api/collab/document.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CollaborativeDocument',
  method: 'GET',
  path: '/documents/:docId/collaborate',
  middleware: [authMiddleware],
  websocket: true
}

export const handler = async (req, { state, streams }) => {
  const { docId } = req.pathParams
  const userId = req.user.userId
  const ws = req.ws
  
  // Join document session
  const sessionId = crypto.randomUUID()
  await state.set('doc_sessions', `${docId}:${sessionId}`, {
    userId,
    cursor: null,
    selection: null,
    color: generateUserColor(userId)
  })
  
  // Subscribe to document changes
  const docStream = streams[`document:${docId}`]
  
  docStream.subscribe('operations', (operation) => {
    ws.send(JSON.stringify({
      type: 'operation',
      ...operation
    }))
  })
  
  docStream.subscribe('cursors', (cursor) => {
    if (cursor.userId !== userId) {
      ws.send(JSON.stringify({
        type: 'cursor',
        ...cursor
      }))
    }
  })
  
  // Handle incoming operations
  ws.on('message', async (msg) => {
    const data = JSON.parse(msg.toString())
    
    switch (data.type) {
      case 'operation':
        // Validate and apply operation
        const op = await transformOperation(data.operation, docId)
        await applyOperation(docId, op)
        
        // Broadcast to others
        await docStream.set('operations', op.id, {
          ...op,
          userId,
          timestamp: Date.now()
        })
        break
        
      case 'cursor':
        // Broadcast cursor position
        await docStream.set('cursors', userId, {
          userId,
          position: data.position,
          selection: data.selection
        }, 30) // 30 second TTL
        break
    }
  })
}
```

### Live Presence
```typescript
// steps/events/presence.step.ts
export const config: EventConfig = {
  type: 'event',
  name: 'PresenceManager',
  subscribes: ['presence.join', 'presence.leave', 'presence.heartbeat']
}

export const handler = async (input, { state, streams }) => {
  const { channel, userId } = input
  const presenceStream = streams[`presence:${channel}`]
  
  switch (input.topic) {
    case 'presence.join':
      const userData = await state.get('users', userId)
      await presenceStream.set('users', userId, {
        id: userId,
        name: userData.name,
        avatar: userData.avatar,
        status: 'online',
        joinedAt: Date.now()
      })
      break
      
    case 'presence.leave':
      await presenceStream.delete('users', userId)
      break
      
    case 'presence.heartbeat':
      const presence = await presenceStream.get('users', userId)
      if (presence) {
        presence.lastSeen = Date.now()
        await presenceStream.set('users', userId, presence, 60) // 60 second TTL
      }
      break
  }
}
```

## Server-Sent Events (SSE)

### Live Feed Updates
```typescript
// steps/api/feed/live.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'LiveFeed',
  method: 'GET',
  path: '/feed/live',
  middleware: [authMiddleware]
}

export const handler = async (req, res, { streams }) => {
  const userId = req.user.userId
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable Nginx buffering
  })
  
  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`)
  
  // Subscribe to user's feed
  const feedStream = streams[`feed:${userId}`]
  const unsubscribe = feedStream.subscribe((update) => {
    res.write(`event: ${update.type}\ndata: ${JSON.stringify(update.data)}\nid: ${update.id}\n\n`)
  })
  
  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n')
  }, 30000)
  
  // Clean up on disconnect
  req.on('close', () => {
    unsubscribe()
    clearInterval(heartbeat)
    res.end()
  })
}
```

## Real-time Notifications

### Push Notification System
```typescript
// steps/events/push-notifications.step.ts
export const config: EventConfig = {
  type: 'event',
  name: 'PushNotifications',
  subscribes: ['notification.send'],
  emits: ['notification.delivered', 'notification.failed']
}

export const handler = async (input, { state, streams }) => {
  const { userId, title, body, data, priority = 'normal' } = input
  
  // Get user's devices
  const devices = await state.getGroup(`devices:${userId}`) || []
  
  // Send to all devices
  const results = await Promise.allSettled(
    devices.map(device => sendPushNotification(device, { title, body, data }))
  )
  
  // Stream notification to connected clients
  const userStream = streams[`user:${userId}`]
  await userStream.set('notifications', crypto.randomUUID(), {
    title,
    body,
    data,
    timestamp: Date.now(),
    read: false
  })
  
  // Track delivery
  const delivered = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  if (delivered > 0) {
    await emit({
      topic: 'notification.delivered',
      data: { userId, delivered, failed }
    })
  }
}
```

## Real-time Analytics

### Live Dashboard
```typescript
// steps/api/analytics/live.step.ts
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'LiveAnalytics',
  method: 'GET',
  path: '/analytics/live',
  middleware: [authMiddleware, requireRole(['admin'])],
  websocket: true
}

export const handler = async (req, { streams, state }) => {
  const ws = req.ws
  const analyticsStream = streams['analytics:live']
  
  // Send current stats
  const currentStats = await calculateCurrentStats(state)
  ws.send(JSON.stringify({
    type: 'snapshot',
    data: currentStats
  }))
  
  // Subscribe to live updates
  analyticsStream.subscribe('metrics', (metric) => {
    ws.send(JSON.stringify({
      type: 'metric_update',
      data: metric
    }))
  })
  
  // Subscribe to alerts
  analyticsStream.subscribe('alerts', (alert) => {
    ws.send(JSON.stringify({
      type: 'alert',
      data: alert
    }))
  })
}

// Metric collector
export const collectMetrics: EventConfig = {
  type: 'event',
  name: 'CollectMetrics',
  subscribes: ['api.request', 'user.action', 'system.event']
}

export const metricsHandler = async (input, { streams, state }) => {
  const metric = {
    type: input.topic.split('.')[0],
    action: input.topic.split('.')[1],
    value: input.value || 1,
    timestamp: Date.now()
  }
  
  // Update counters
  await incrementCounter(state, metric)
  
  // Stream to dashboard
  const analyticsStream = streams['analytics:live']
  await analyticsStream.set('metrics', crypto.randomUUID(), metric)
  
  // Check for alerts
  if (await shouldAlert(metric, state)) {
    await analyticsStream.set('alerts', crypto.randomUUID(), {
      level: 'warning',
      message: `High ${metric.type} activity detected`,
      metric
    })
  }
}
```

## Performance Optimization

### Connection Pooling
```typescript
class WebSocketPool {
  private pools: Map<string, Set<WebSocket>> = new Map()
  
  addToPool(channel: string, ws: WebSocket) {
    if (!this.pools.has(channel)) {
      this.pools.set(channel, new Set())
    }
    this.pools.get(channel)!.add(ws)
  }
  
  broadcast(channel: string, message: any) {
    const pool = this.pools.get(channel)
    if (!pool) return
    
    const data = JSON.stringify(message)
    pool.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })
  }
  
  removeFromPool(channel: string, ws: WebSocket) {
    this.pools.get(channel)?.delete(ws)
  }
}
```

### Message Batching
```typescript
class MessageBatcher {
  private queue: Map<string, any[]> = new Map()
  private interval: number = 50 // 50ms batching window
  
  add(clientId: string, message: any) {
    if (!this.queue.has(clientId)) {
      this.queue.set(clientId, [])
      setTimeout(() => this.flush(clientId), this.interval)
    }
    this.queue.get(clientId)!.push(message)
  }
  
  flush(clientId: string) {
    const messages = this.queue.get(clientId)
    if (!messages || messages.length === 0) return
    
    const ws = getWebSocket(clientId)
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'batch',
        messages
      }))
    }
    
    this.queue.delete(clientId)
  }
}
```