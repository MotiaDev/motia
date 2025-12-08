# @motiadev/core

Core functionality for Motia - Build production-grade backends with a single primitive.

## Installation

```bash
npm install @motiadev/core
# or
yarn add @motiadev/core
# or
pnpm add @motiadev/core
```

## Overview

`@motiadev/core` is the foundation of Motia, the unified backend framework for:

- **API** endpoints with routing and validation
- **Background jobs** with built-in queues
- **Durable workflows** with state management
- **Agentic** AI workflows with streaming
- **State** management across all steps
- **Streaming** real-time data to clients
- **Logging** and observability infrastructure
- **Multi-language** support (TypeScript, Python, Ruby)

## Key Components

### Server

Create and manage an HTTP server for handling API requests:

```typescript
import { createServer } from '@motiadev/core'

const server = createServer(lockedData, eventManager, stateAdapter, config)
```

### Event Management

Publish and subscribe to events across your application:

```typescript
import { createEventManager } from '@motiadev/core'

const eventManager = createEventManager()

// Subscribe to events
eventManager.subscribe({
  event: 'user.created',
  handlerName: 'sendWelcomeEmail',
  filePath: '/path/to/handler.ts',
  handler: (event) => {
    // Handle the event
  },
})

// Emit events
eventManager.emit({
  topic: 'user.created',
  data: { userId: '123' },
  traceId: 'trace-123',
  logger: logger,
})
```

### Step Handlers

Create handlers for different types of steps (API, Event, Cron):

```typescript
import { createStepHandlers } from '@motiadev/core'

const stepHandlers = createStepHandlers(lockedData, eventManager, state, config)
```

### State Management

Manage application state with different adapters:

```typescript
import { createStateAdapter } from '@motiadev/core'

const stateAdapter = createStateAdapter({
  adapter: 'redis',
  host: 'localhost',
  port: 6379,
})

// Use state in your handlers
await state.set(traceId, 'key', value)
const value = await state.get(traceId, 'key')
```

### Cron Jobs

Schedule and manage cron jobs:

```typescript
import { setupCronHandlers } from '@motiadev/core'

const cronManager = setupCronHandlers(lockedData, eventManager, state, loggerFactory)
```

## Multi-language Support

Motia supports writing step handlers in multiple languages:

- TypeScript/JavaScript
- Python
- Ruby

Each language has its own runner that communicates with the core framework.

## Types

The package exports TypeScript types for all components:

```typescript
import { Event, FlowContext, ApiRouteConfig, EventConfig, CronConfig } from '@motiadev/core'
```

## License

This package is part of the Motia framework and is licensed under the same terms.
