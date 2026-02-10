---
title: Testing
description: Test your Motia Backend System - APIs, Queue handlers
---

You built an API. You added some queue handlers. Everything seems to work. But does it?

Without tests, you're guessing. With tests, you know.

Motia has `@motiadev/test` built in. It helps you:
- Test API triggers (hit endpoints, check responses)
- Test Queue triggers (verify messages get enqueued)
- Mock contexts for unit tests

---

## Install
```bash
npm install @motiadev/test --save-dev
```

```bash
pnpm add @motiadev/test --save-dev
```

---

## Test API Triggers

Here's an API Step that creates a todo and enqueues a message:

```typescript title="src/create-todo.step.ts"
import { type Handlers, type StepConfig } from 'motia'
import { z } from 'zod'

export const config = {
  name: 'CreateTodo',
  description: 'Create a new todo item',
  triggers: [
    { type: 'api', path: '/todo', method: 'POST' },
  ],
  enqueues: ['todo.created'],
  flows: ['todo-app'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (req, { enqueue }) => {
  const todo = { id: '123', description: req.body.description }

  await enqueue({ topic: 'todo.created', data: todo })

  return { status: 200, body: todo }
}
```

Now let's test it:

```typescript title="src/create-todo.step.test.ts"
import { createMotiaTester } from '@motiadev/test'
import { describe, it, expect, afterAll } from 'vitest'

describe('CreateTodo', () => {
  const tester = createMotiaTester()

  afterAll(async () => {
    await tester.close()
  })

  it('should create a todo and return 200', async () => {
    const response = await tester.post('/todo', {
      body: { description: 'Buy milk' }
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: expect.any(String),
      description: 'Buy milk'
    })
  })

  it('should enqueue todo.created message', async () => {
    const watcher = await tester.watch('todo.created')

    await tester.post('/todo', {
      body: { description: 'Buy bread' }
    })

    await tester.waitEvents()

    const events = watcher.getCapturedEvents()
    expect(events).toHaveLength(1)
    expect(events[0].data).toMatchObject({
      description: 'Buy bread'
    })
  })
})
```

**What's happening here:**
- `createMotiaTester()` - Spins up a test version of your app
- `tester.post()` - Hits your API like a real client would
- `tester.watch()` - Captures messages on a topic
- `tester.waitEvents()` - Waits for all async stuff to finish
- Then check if everything worked

---

## Test Queue Triggers

Queue Steps listen for messages and do stuff in the background. Here's how to test them:

```typescript title="src/process-todo.step.ts"
import { type Handlers, type StepConfig } from 'motia'
import { z } from 'zod'

export const config = {
  name: 'ProcessTodo',
  description: 'Process a todo item',
  triggers: [
    { type: 'queue', topic: 'todo.created' },
  ],
  enqueues: ['todo.processed'],
  flows: ['todo-app'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (input, { enqueue, logger }) => {
  logger.info('Processing todo', { id: input.id })

  const processed = { ...input, processed: true }

  await enqueue({ topic: 'todo.processed', data: processed })
}
```

**The Test:**

```typescript title="src/process-todo.step.test.ts"
import { createMotiaTester } from '@motiadev/test'
import { describe, it, expect, afterAll } from 'vitest'

describe('ProcessTodo', () => {
  const tester = createMotiaTester()

  afterAll(async () => {
    await tester.close()
  })

  it('should process todo when todo.created is enqueued', async () => {
    const watcher = await tester.watch('todo.processed')

    await tester.enqueue({
      topic: 'todo.created',
      data: { id: '123', description: 'Test todo' },
      traceId: 'test-trace'
    })

    await tester.waitEvents()

    const events = watcher.getCapturedEvents()
    expect(events).toHaveLength(1)
    expect(events[0].data).toMatchObject({
      id: '123',
      description: 'Test todo',
      processed: true
    })
  })
})
```

Use `tester.enqueue()` to manually fire messages and test Queue triggers without hitting APIs.

---

## Unit Test Handlers

Don't want to spin up the whole app? Test handler functions directly:

```typescript title="src/calculate-total.step.test.ts"
import { createMockContext } from '@motiadev/test'
import { handler } from './calculate-total.step'
import { describe, it, expect } from 'vitest'

describe('CalculateTotal Handler', () => {
  it('should calculate total correctly', async () => {
    const mockContext = createMockContext()

    const input = { items: [{ price: 10 }, { price: 20 }] }

    await handler(input, mockContext)

    expect(mockContext.enqueue).toHaveBeenCalledWith({
      topic: 'total.calculated',
      data: { total: 30 }
    })
  })

  it('should log calculation', async () => {
    const mockContext = createMockContext()

    await handler({ items: [] }, mockContext)

    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Calculating total')
    )
  })
})
```

---

## Run Your Tests

**All tests:**

```bash
npm test
```

```bash
pnpm test
```

**Watch mode** (re-runs when you save files):

```bash
npm test -- --watch
```

```bash
pnpm test --watch
```

**Single test file:**

```bash
npm test -- src/create-todo.step.test.ts
```

---

## Tester API

### `createMotiaTester()`

Starts a test version of your app.

```typescript
const tester = createMotiaTester()
```

**What you can do with it:**

| Method | What it does |
|--------|-------------|
| `post(path, options)` | Hit a POST endpoint |
| `get(path, options)` | Hit a GET endpoint |
| `enqueue(message)` | Enqueue a message to a topic |
| `watch(topic)` | Catch messages on a topic |
| `waitEvents()` | Wait for messages to finish |
| `sleep(ms)` | Pause for X milliseconds |
| `close()` | Shut down the tester |

### `createMockContext()`

Mock a context for testing handlers directly.

```typescript
const mockContext = createMockContext({
  logger: customLogger,
  enqueue: customEnqueue,
  traceId: 'custom-id'
})
```

**You get:**
- `logger` - Mock logger (Jest spy)
- `enqueue` - Mock enqueue (Jest spy)
- `traceId` - Request trace ID
- `state` - Mock state manager

---

## Tips

- **Start simple** - Test basic stuff first, then edge cases
- **Test errors** - Make sure your error handling actually works
- **Watch messages** - Don't assume messages were enqueued, check them
- **Always wait** - Call `waitEvents()` or messages might not finish
- **Clean up** - Always `close()` the tester when done
- **Keep it isolated** - Each test should work on its own
- **Name tests well** - Say what you're checking, not how

---
