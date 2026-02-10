---
title: Real-time Streams
description: Push live updates from your backend to connected clients without polling. Perfect for AI responses, chat apps, and long-running tasks.
---

import VideoPlayer from '@/components/VideoPlayer';

<VideoPlayer videoPath="https://assets.motia.dev/videos/mp4/site/v1/7-motia-streaming.mp4" gifPath="https://assets.motia.dev/images/gifs/v1/7-motia-streaming.gif" title="Real-time Streaming" className="mb-8" />

## Why Streams?

Building modern apps means dealing with long-running tasks - AI responses that stream in word by word, file processing that takes time, or chat messages that need to appear instantly.

Without Streams, you'd need to:
- Build polling logic on the frontend
- Set up WebSocket infrastructure manually
- Manage connection states and reconnection
- Handle data synchronization yourself

With Motia Streams, you get all of this out of the box. Just define what data you want to stream, and Motia handles the rest.

## Some Use Cases for Streams

- **AI/LLM responses** - Stream ChatGPT responses as they generate
- **Chat applications** - Real-time messaging and typing indicators
- **Long processes** - Video processing, data exports, batch operations
- **Live dashboards** - Real-time metrics and notifications
- **Collaborative tools** - Real-time updates across multiple users

---

## Creating a Stream

Streams are just files. Create a `.stream.ts` file in your `src/` folder and export a config.

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript title="src/chat-messages.stream.ts"
import { StreamConfig } from 'motia'
import { z } from 'zod'

export const config: StreamConfig = {
  name: 'chatMessage',
  schema: z.object({
    id: z.string(),
    userId: z.string(),
    message: z.string(),
    timestamp: z.string()
  }),
  baseConfig: {
    storageType: 'default'
  }
}
```

</Tab>
<Tab value='Python'>

```python title="src/chat_messages_stream.py"
from pydantic import BaseModel

class ChatMessage(BaseModel):
    id: str
    user_id: str
    message: str
    timestamp: str

config = {
    "name": "chatMessage",
    "schema": ChatMessage.model_json_schema(),
    "baseConfig": {"storageType": "default"}
}
```

</Tab>
<Tab value='JavaScript'>

```javascript title="src/chat-messages.stream.js"
const config = {
  name: 'chatMessage',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      message: { type: 'string' },
      timestamp: { type: 'string' }
    },
    required: ['id', 'userId', 'message', 'timestamp']
  },
  baseConfig: {
    storageType: 'default'
  }
}

module.exports = { config }
```

</Tab>
</Tabs>

That's it. Motia auto-discovers the stream and makes it available as `context.streams.chatMessage` in all your handlers.

---

## Using Streams in Steps

Once you've defined a stream, you can use it in any Step through `context.streams`.

### Stream Methods

Every stream has these methods:

| Method | What it does |
|--------|-------------|
| `set(groupId, id, data)` | Create or update an item. Returns `StreamSetResult` with `new_value` and `old_value` |
| `get(groupId, id)` | Get a single item |
| `delete(groupId, id)` | Remove an item |
| `getGroup(groupId)` | Get all items in a group |
| `update(groupId, id, ops)` | Atomic update with `UpdateOp[]`. Returns `{ new_value, old_value }` |
| `send(channel, event)` | Send ephemeral events (typing, reactions, etc.) |

**Think of it like this:**
- `groupId` = Which room/conversation/user
- `id` = Which specific item in that room
- `data` = The actual data matching your schema

### Atomic Updates with `update()`

Use the `update()` method for atomic operations on stream items:

```typescript
import { type UpdateOp } from 'motia'

const ops: UpdateOp[] = [
  { type: 'set', path: 'name', value: 'New Name' },
  { type: 'increment', path: 'count', by: 1 },
  { type: 'decrement', path: 'stock', by: 1 },
]
const result = await streams.myStream.update('groupId', 'itemId', ops)
// result has new_value and old_value
```

---

## Real Example: Todo App with Real-Time Sync

Let's build a todo app where all connected clients see updates instantly.

<Callout type="info">
  This is a real, working example from the [Motia Examples Repository](https://github.com/MotiaDev/motia-examples/tree/main/examples/realtime-todo-app). You can clone it and run it locally!
</Callout>

**Step 1:** Create the stream definition

```typescript title="src/todo.stream.ts"
import { StreamConfig } from 'motia'
import { z } from 'zod'

const todoSchema = z.object({
  id: z.string(),
  description: z.string(),
  createdAt: z.string(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional()
})

export const config: StreamConfig = {
  name: 'todo',
  schema: todoSchema,
  baseConfig: { storageType: 'default' }
}

export type Todo = z.infer<typeof todoSchema>
```

**Step 2:** Create an API endpoint that uses streams

```typescript title="src/create-todo.step.ts"
import { type Handlers, type StepConfig } from 'motia'
import { z } from 'zod'
import { Todo } from './todo.stream'

export const config = {
  name: 'CreateTodo',
  description: 'Create a new todo item',
  triggers: [
    { type: 'api', path: '/todo', method: 'POST' },
  ],
  flows: ['todo-app'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, { logger, streams }) => {
  logger.info('Creating new todo', { body: req.body })

  const { description, dueDate } = req.body
  const todoId = `todo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  if (!description) {
    return { status: 400, body: { error: 'Description is required' } }
  }

  const newTodo: Todo = {
    id: todoId,
    description,
    createdAt: new Date().toISOString(),
    dueDate,
    completedAt: undefined
  }

  // Store in the 'inbox' group - all clients watching this group see the update!
  const todo = await streams.todo.set('inbox', todoId, newTodo)

  logger.info('Todo created successfully', { todoId })

  return { status: 200, body: todo }
}
```

**What happens here:**
1. Client calls `POST /todo` with a description
2. Server creates the todo and calls `streams.todo.set('inbox', todoId, newTodo)`
3. **Instantly**, all clients subscribed to the `inbox` group receive the new todo
4. No polling, no refresh needed

Every time you call `streams.todo.set()`, connected clients receive the update instantly. No polling needed.

---

## Restricting Stream Access

Streams can enforce authentication and authorization rules so that only approved clients can subscribe.

### 1. Configure `streamAuth`

```typescript title="stream-auth.ts"
import type { StreamAuthRequest } from 'motia'
import { z } from 'zod'

const streamAuthContextSchema = z.object({
  userId: z.string(),
  plan: z.enum(['free', 'pro']),
  projectIds: z.array(z.string()),
})

const extractAuthToken = (request: StreamAuthRequest): string | undefined => {
  const protocolHeader = request.headers['sec-websocket-protocol']
  if (protocolHeader?.includes('Authorization')) {
    const [, token] = protocolHeader.split(',')
    if (token) {
      return token.trim()
    }
  }

  if (!request.url) return undefined

  try {
    const url = new URL(request.url, 'http://localhost')
    return url.searchParams.get('authToken') ?? undefined
  } catch {
    return undefined
  }
}
```

### 2. Apply fine-grained rules with `canAccess`

Each stream can expose an optional `canAccess` function that receives the subscription info plus the `StreamAuthContext` value returned by your `authenticate` function.

```typescript title="src/chat-messages.stream.ts"
export const config: StreamConfig = {
  name: 'chatMessage',
  schema: chatMessageSchema,
  baseConfig: { storageType: 'default' },
  canAccess: ({ groupId, id }, authContext) => {
    if (!authContext) return false
    return authContext.projectIds.includes(groupId)
  },
}
```

`canAccess` can be synchronous or async. If it's not defined, Motia allows every client (even anonymous ones) to subscribe.

### 3. Send tokens from the client

Provide an auth token when creating the stream client by embedding it in the WebSocket URL.

```tsx title="App.tsx"
import { useMemo } from 'react'
import { MotiaStreamProvider } from '@motiadev/stream-client-react'

function AppShell({ session }: { session?: { streamToken?: string } }) {
  const streamAddress = useMemo(() => new URL('ws://localhost:3000').toString(), [])
  const protocols = useMemo(() => {
    return session?.streamToken ? ['Authorization', session.streamToken] : undefined
  }, [session?.streamToken])

  return (
    <MotiaStreamProvider address={streamAddress} protocols={protocols}>
      <App />
    </MotiaStreamProvider>
  )
}
```

Using the browser/node clients directly:

```ts
import { Stream } from '@motiadev/stream-client-node'

const url = new URL('wss://api.example.com/streams')
if (process.env.STREAM_TOKEN) {
  url.searchParams.set('authToken', process.env.STREAM_TOKEN)
}

const stream = new Stream(url.toString())
```

---

## Testing Streams in the iii Console

Testing real-time features can be tricky. The iii console makes it easy.

**How to test:**

1. Make sure your API Step returns the stream object:

```typescript
return { status: 200, body: todo }
```

2. Open [http://localhost:3000/endpoints](http://localhost:3000/endpoints)
3. Watch the stream update in real-time

![Stream Test in iii Console](./../img/todo-workbench.png)

The iii console automatically detects stream responses and subscribes to them for you.

---

## Using Streams in Your Frontend

Once you have streams working on the backend, connect them to your React app.

### Install

```bash
npm install @motiadev/stream-client-react
```

### Setup Provider

Wrap your app with the provider:

```tsx title="App.tsx"
import { MotiaStreamProvider } from '@motiadev/stream-client-react'

function App() {
  const authToken = useAuthToken()

  return (
    <MotiaStreamProvider address="ws://localhost:3000" authToken={authToken}>
      {/* Your app */}
    </MotiaStreamProvider>
  )
}
```

### Subscribe to Stream Updates

```tsx title="App.tsx"
import { useStreamGroup } from '@motiadev/stream-client-react'
import { useTodoEndpoints, type Todo } from './hook/useTodoEndpoints'

function App() {
  const { createTodo, updateTodo, deleteTodo } = useTodoEndpoints()

  const { data: todos } = useStreamGroup<Todo>({
    groupId: 'inbox',
    streamName: 'todo'
  })

  const handleAddTodo = async (description: string) => {
    await createTodo(description)
  }

  return (
    <div>
      <h1>Inbox</h1>
      {todos.map((todo) => (
        <div key={todo.id}>{todo.description}</div>
      ))}
    </div>
  )
}
```

**How it works:**
1. `useStreamGroup()` subscribes to all items in the `inbox` group
2. When server calls `streams.todo.set('inbox', todoId, newTodo)`, the `todos` array updates automatically
3. React re-renders with the new data
4. Works across all connected clients!

![Todo App in React](./../img/todo-react.png)

Every time you call `createTodo()`, connected clients receive the update instantly. No polling needed.

---

## Ephemeral Events

Sometimes you need to send temporary events that don't need to be stored - like typing indicators, reactions, or online status.

Use `streams.<name>.send()` for this:

<Tabs items={['TypeScript', 'Python', 'JavaScript']}>
<Tab value='TypeScript'>

```typescript
await streams.chatMessage.send(
  { groupId: channelId },
  { type: 'typing', data: { userId: 'user-123', isTyping: true } }
)

await streams.chatMessage.send(
  { groupId: channelId, id: messageId },
  { type: 'reaction', data: { emoji: '👍', userId: 'user-123' } }
)
```

</Tab>
<Tab value='Python'>

```python
await context.streams.chatMessage.send(
    {"groupId": channel_id},
    {"type": "typing", "data": {"userId": "user-123", "isTyping": True}}
)

await context.streams.chatMessage.send(
    {"groupId": channel_id, "id": message_id},
    {"type": "reaction", "data": {"emoji": "👍", "userId": "user-123"}}
)
```

</Tab>
<Tab value='JavaScript'>

```javascript
await streams.chatMessage.send(
  { groupId: channelId },
  { type: 'typing', data: { userId: 'user-123', isTyping: true } }
)

await streams.chatMessage.send(
  { groupId: channelId, id: messageId },
  { type: 'reaction', data: { emoji: '👍', userId: 'user-123' } }
)
```

</Tab>
</Tabs>

**Difference from `set()`:**
- `set()` - Stores data, clients sync to it. Returns `{ new_value, old_value }`
- `send()` - Fire-and-forget events, not stored

---

## Remember

- **Streams = Real-time state** that clients subscribe to
- **Every `set()` call** pushes updates to connected clients instantly and returns `{ new_value, old_value }`
- **Use `update()`** for atomic operations (increment, decrement, set fields)
- **Use `send()`** for temporary events like typing indicators
- **Test in the iii console** before building your frontend
- **No polling needed** - WebSocket connection handles everything

---

## What's Next?

<Cards>
  <Card href="/docs/development-guide/state-management" title="State Management">
    Learn about persistent storage across Steps
  </Card>

  <Card href="/docs/concepts/steps" title="Steps">
    Deep dive into building with Steps
  </Card>
</Cards>
