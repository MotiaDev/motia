# claude-workflows.md: Complete Guide for Claude Code to Write Motia Workflows

This guide equips Claude Code to generate Motia workflows, a code-first, event-driven framework supporting JavaScript (JS), TypeScript (TS), Python, and Ruby. It covers all step types, state management, logging, testing, CLI commands, Workbench features, and best practices for creating robust, scalable workflows.

## Overview

- **Purpose**: Build observable, event-driven workflows with minimal infrastructure setup.
- **Core Components**:
  - **Steps**: Logic units (API, Event, Cron, NOOP) that subscribe to events, process data, and emit events.
  - **Flows**: Named groups of steps (e.g., "payment-flow") for visualization and organization.
  - **Events**: Messages routed via topics (e.g., "order.placed") between steps.
  - **Topics**: Event labels for subscription and emission.
  - **State**: Persistent data across steps, scoped by `traceId`.
  - **Workbench**: Visual tool at `http://localhost:3000` for flow design, testing, and debugging.

## Instructions for Claude Code

- **Default Language**: For any given step, use the best lanaguge for the job. For example if the step requires a dependency that is best in npm use TypeScript. Same applies for Python and Ruby.
- **Module Format**: Use ES modules (`import/export`) for TS, CommonJS (`module.exports`) for JS. Use standard module/require for Python and Ruby.
- **File Structure**: Keep all code in one file unless I request multiple files.
- **Dependencies**: Minimize external libraries; use official SDKs (e.g., `@slack/web-api`) when integrating services.
- **Code Standards**:
  - Include error handling with try-catch (TS/JS) or try-except (Python) or begin-rescue (Ruby).
  - Add logging with `logger` (e.g., `logger.info`, `logger.error`).
  - Use TypeScript types/interfaces for TS, type hints/dataclasses for Python, and Sorbet types for Ruby where applicable.
  - Never hardcode secrets—use `process.env`.
- **Security**: Validate inputs (Zod for TS/JS, JSON Schema for Python/Ruby), sanitize data, handle CORS, follow least privilege.
- **Output Format**: Use Markdown with separate blocks:
  1. Main step code (e.g., `api.step.ts`, `api_step.py`, `api.step.rb`).
  2. Configuration (`config` object or method).
  3. Example usage (e.g., `curl` or `npx motia emit`).
- **State Scope**: Use `ctx.traceId` as the default scope for state isolation.
- **Implementation**: Always build real-world implementaiton. Abstract out services in another folder to use if nessesary. Never mock out or put in comments like "In a real implementation..." unless the user has asked specifically to mock out one of the integrations.

## Step Types and Templates

### 1. API Step

- **Purpose**: Exposes an HTTP endpoint to trigger workflows.
- **Config**: Requires `path`, `method`, `bodySchema`.
- **Handler**: Returns `{ status: number, body: any }`.

**Template (JavaScript)**:

```javascript
// api.step.js
const config = {
  type: 'api',
  name: 'ApiTrigger',
  description: 'Triggers workflow via API',
  path: '/trigger',
  method: 'POST',
  emits: ['trigger.received'],
  bodySchema: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  flows: ['my-flow']
}

const handler = async (req, { logger, emit }) => {
  logger.info('API request received', { body: req.body })
  try {
    const data = req.body
    await emit({ topic: 'trigger.received', data })
    return { status: 200, body: { message: 'Success' } }
  } catch (error) {
    logger.error('API error', { error: error.message })
    return { status: 500, body: { error: 'Internal error' } }
  }
}

module.exports = { config, handler }
```

**Template (TypeScript)**:

```typescript
// api.step.ts
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ApiTrigger',
  description: 'Triggers workflow via API',
  path: '/trigger',
  method: 'POST',
  emits: ['trigger.received'],
  bodySchema: z.object({ message: z.string() }),
  flows: ['my-flow'],
}

export const handler: Handlers['ApiTrigger'] = async (req, { logger, emit }) => {
  logger.info('API request received', { body: req.body })
  try {
    const data = req.body
    await emit({ topic: 'trigger.received', data })
    return { status: 200, body: { message: 'Success' } }
  } catch (error) {
    logger.error('API error', { error: error.message })
    return { status: 500, body: { error: 'Internal error' } }
  }
}
```

**Template (Python)**:

```python
# api_step.py
config = {
    'type': 'api',
    'name': 'ApiTrigger',
    'description': 'Triggers workflow via API',
    'path': '/trigger',
    'method': 'POST',
    'emits': ['trigger.received'],
    'bodySchema': {
        'type': 'object',
        'properties': {
            'message': {'type': 'string'}
        },
        'required': ['message']
    },
    'flows': ['my-flow']
}

async def handler(req, ctx):
    ctx.logger.info('API request received', {'body': req.body})
    try:
        data = req.body
        await ctx.emit({'topic': 'trigger.received', 'data': data})
        return {'status': 200, 'body': {'message': 'Success'}}
    except Exception as error:
        ctx.logger.error('API error', {'error': str(error)})
        return {'status': 500, 'body': {'error': 'Internal error'}}
```

**Template (Ruby)**:

```ruby
# api.step.rb
def config
  {
    type: 'api',
    name: 'ApiTrigger',
    description: 'Triggers workflow via API',
    path: '/trigger',
    method: 'POST',
    emits: ['trigger.received'],
    bodySchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    flows: ['my-flow']
  }
end

def handler(req, ctx)
  ctx.logger.info('API request received', { body: req.body })
  begin
    data = req.body
    ctx.emit({ topic: 'trigger.received', data: data })
    { status: 200, body: { message: 'Success' } }
  rescue StandardError => error
    ctx.logger.error('API error', { error: error.message })
    { status: 500, body: { error: 'Internal error' } }
  end
end
```

**Prompt**: "Create an API step at `/feedback` accepting `message: string`, emitting `feedback.received`."

### 2. Event Step

- **Purpose**: Listens to events and emits new ones.
- **Config**: Requires `subscribes`, `emits`; optional `input` schema.

**Template (JavaScript)**:

```javascript
// event.step.js
const config = {
  type: 'event',
  name: 'EventProcessor',
  description: 'Processes event data',
  subscribes: ['trigger.received'],
  emits: ['trigger.processed'],
  input: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  flows: ['my-flow']
}

const handler = async (input, { logger, emit, state, traceId }) => {
  logger.info('Processing event', { input })
  try {
    await state.set(traceId, 'result', { value: input.message })
    await emit({ topic: 'trigger.processed', data: { result: `Processed: ${input.message}` } })
  } catch (error) {
    logger.error('Event failed', { error: error.message })
  }
}

module.exports = { config, handler }
```

**Template (TypeScript)**:

```typescript
// event.step.ts
import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: EventConfig = {
  type: 'event',
  name: 'EventProcessor',
  description: 'Processes event data',
  subscribes: ['trigger.received'],
  emits: ['trigger.processed'],
  input: z.object({ message: z.string() }),
  flows: ['my-flow'],
}

export const handler: Handlers['EventProcessor'] = async (input, { logger, emit, state, traceId }) => {
  logger.info('Processing event', { input })
  try {
    await state.set(traceId, 'result', { value: input.message })
    await emit({ topic: 'trigger.processed', data: { result: `Processed: ${input.message}` } })
  } catch (error) {
    logger.error('Event failed', { error: error.message })
  }
}
```

**Template (Python)**:

```python
# event_step.py
config = {
    'type': 'event',
    'name': 'EventProcessor',
    'description': 'Processes event data',
    'subscribes': ['trigger.received'],
    'emits': ['trigger.processed'],
    'input': {
        'type': 'object',
        'properties': {
            'message': {'type': 'string'}
        },
        'required': ['message']
    },
    'flows': ['my-flow']
}

async def handler(input, ctx):
    ctx.logger.info('Processing event', {'input': input})
    try:
        await ctx.state.set(ctx.trace_id, 'result', {'value': input['message']})
        await ctx.emit({'topic': 'trigger.processed', 'data': {'result': f"Processed: {input['message']}"}})
    except Exception as error:
        ctx.logger.error('Event failed', {'error': str(error)})
```

**Template (Ruby)**:

```ruby
# event.step.rb
def config
  {
    type: 'event',
    name: 'EventProcessor',
    description: 'Processes event data',
    subscribes: ['trigger.received'],
    emits: ['trigger.processed'],
    input: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    flows: ['my-flow']
  }
end

def handler(input, ctx)
  ctx.logger.info('Processing event', { input: input })
  begin
    ctx.state.set(ctx.trace_id, 'result', { value: input[:message] })
    ctx.emit({ topic: 'trigger.processed', data: { result: "Processed: #{input[:message]}" } })
  rescue StandardError => error
    ctx.logger.error('Event failed', { error: error.message })
  end
end
```

**Prompt**: "Write an event step listening to `feedback.received`, saving `message` to state, emitting `feedback.processed`."

### 3. Cron Step

- **Purpose**: Runs on a schedule using cron syntax (e.g., `0 9 * * *` for 9 AM daily).
- **Config**: Requires `cron`.

**Template (JavaScript)**:

```javascript
// cron.step.js
const config = {
  type: 'cron',
  name: 'DailyTask',
  description: 'Runs daily at 9 AM',
  cron: '0 9 * * *',
  emits: ['task.ran'],
  flows: ['my-flow']
}

const handler = async (_, { logger, emit }) => {
  logger.info('Cron job started')
  try {
    await emit({ topic: 'task.ran', data: { timestamp: Date.now() } })
    logger.info('Cron job completed')
  } catch (error) {
    logger.error('Cron job failed', { error: error.message })
  }
}

module.exports = { config, handler }
```

**Template (TypeScript)**:

```typescript
// cron.step.ts
import { CronConfig, Handlers } from 'motia'

export const config: CronConfig = {
  type: 'cron',
  name: 'DailyTask',
  description: 'Runs daily at 9 AM',
  cron: '0 9 * * *',
  emits: ['task.ran'],
  flows: ['my-flow'],
}

export const handler: Handlers['DailyTask'] = async (_, { logger, emit }) => {
  logger.info('Cron job started')
  try {
    await emit({ topic: 'task.ran', data: { timestamp: Date.now() } })
    logger.info('Cron job completed')
  } catch (error) {
    logger.error('Cron job failed', { error: error.message })
  }
}
```

**Template (Python)**:

```python
# cron_step.py
config = {
    'type': 'cron',
    'name': 'DailyTask',
    'description': 'Runs daily at 9 AM',
    'cron': '0 9 * * *',
    'emits': ['task.ran'],
    'flows': ['my-flow']
}

async def handler(input, ctx):
    ctx.logger.info('Cron job started')
    try:
        await ctx.emit({'topic': 'task.ran', 'data': {'timestamp': int(time.time())}})
        ctx.logger.info('Cron job completed')
    except Exception as error:
        ctx.logger.error('Cron job failed', {'error': str(error)})
import time
```

**Template (Ruby)**:

```ruby
# cron.step.rb
def config
  {
    type: 'cron',
    name: 'DailyTask',
    description: 'Runs daily at 9 AM',
    cron: '0 9 * * *',
    emits: ['task.ran'],
    flows: ['my-flow']
  }
end

def handler(_, ctx)
  ctx.logger.info('Cron job started')
  begin
    ctx.emit({ topic: 'task.ran', data: { timestamp: Time.now.to_i } })
    ctx.logger.info('Cron job completed')
  rescue StandardError => error
    ctx.logger.error('Cron job failed', { error: error.message })
  end
end
```

**Prompt**: "Generate a cron step running daily at 9 AM, emitting `daily.check` with a timestamp."

### 4. NOOP Step (TS/JS Only)

- **Purpose**: Simulates external processes (e.g., webhooks, human tasks).
- **Files**: `.ts` for config, `.tsx` for optional UI.

**Template (TS)**:

```typescript
// external-noop.step.ts
import { NoopConfig } from 'motia'

export const config: NoopConfig = {
  type: 'noop',
  name: 'ExternalProcess',
  description: 'Simulates external action',
  virtualSubscribes: ['start'],
  virtualEmits: ['done'],
  flows: ['my-flow'],
}
```

```typescript
// external-noop.step.tsx
import React from 'react';
import { BaseHandle, Position } from 'motia/workbench';

export default function ExternalProcess() {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 text-white">
      <div className="text-sm font-medium">External Process</div>
      <BaseHandle type="target" position={Position.Top} />
      <BaseHandle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Prompt**: "Create a NOOP step simulating a webhook from `webhook.sent` to `/api/webhook/received`."

## State Management

- **Access**: Via `ctx.state` in handlers.
- **Methods**:
  - `get(scope: string, key: string)`: Returns `Promise<T | null>`.
  - `set(scope: string, key: string, value: T)`: Stores data.
  - `delete(scope: string, key: string)`: Removes key.
  - `clear(scope: string)`: Clears all data for scope.
  - `cleanup()`: Maintenance (e.g., TTL cleanup).
- **Scope**: Use `ctx.traceId` as the default scope for state isolation.

**Example (JavaScript)**:

```javascript
await ctx.state.set(ctx.traceId, 'data', { value: 'test' })
const data = await ctx.state.get(ctx.traceId, 'data')
await ctx.state.delete(ctx.traceId, 'data')
await ctx.state.clear(ctx.traceId)
```

**Example (TypeScript)**:

```typescript
await ctx.state.set(ctx.traceId, 'data', { value: 'test' })
const data = await ctx.state.get<{ value: string }>(ctx.traceId, 'data')
await ctx.state.delete(ctx.traceId, 'data')
await ctx.state.clear(ctx.traceId)
```

**Example (Python)**:

```python
await ctx.state.set(ctx.trace_id, 'data', {'value': 'test'})
data = await ctx.state.get(ctx.trace_id, 'data')
await ctx.state.delete(ctx.trace_id, 'data')
await ctx.state.clear(ctx.trace_id)
```

**Example (Ruby)**:

```ruby
ctx.state.set(ctx.trace_id, 'data', { value: 'test' })
data = ctx.state.get(ctx.trace_id, 'data')
ctx.state.delete(ctx.trace_id, 'data')
ctx.state.clear(ctx.trace_id)
```

**Adapters**:

- **Memory**: In-memory, non-persistent.
- **File**: Saves to `.motia/motia.state.json`.
- **Redis**: Persistent, configurable in `config.yml`:
  ```yaml
  state:
    adapter: redis
    host: localhost
    port: 6379
    ttl: 3600
  ```

**Prompt**: "Add state to an event step to store and retrieve a `count` number."

## Logging

- **Access**: Via `ctx.logger` in handlers.
- **Levels**: `info`, `warn`, `error`, `debug`.
- **Usage**: Include context for structured logging.

**Example (JavaScript)**:

```javascript
logger.info('Processing started', { input })
logger.warn('Large value', { value: 1000 })
logger.error('Failed', { error: error.message, stack: error.stack })
logger.debug('Details', { rawInput: input })
```

**Example (TypeScript)**:

```typescript
logger.info('Processing started', { input })
logger.warn('Large value', { value: 1000 })
logger.error('Failed', { error: error.message, stack: error.stack })
logger.debug('Details', { rawInput: input })
```

**Example (Python)**:

```python
ctx.logger.info('Processing started', {'input': input})
ctx.logger.warn('Large value', {'value': 1000})
ctx.logger.error('Failed', {'error': str(error), 'stack': traceback.format_exc()})
ctx.logger.debug('Details', {'rawInput': input.__dict__})
```

**Example (Ruby)**:

```ruby
ctx.logger.info('Processing started', { input: input })
ctx.logger.warn('Large value', { value: 1000 })
ctx.logger.error('Failed', { error: error.message, stack: error.backtrace.join("\n") })
ctx.logger.debug('Details', { rawInput: input.to_h })
```

**Prompt**: "Add logging to an API step for request receipt and errors."

## CLI Commands

- **Installation**: Comes with `motia` package (`npx motia`).
- **Key Commands**:
  - `create`: `npx motia create -n my-project -t template-name`
  - `dev`: `npx motia dev -p 3000 --debug` (starts Workbench).
  - `emit`: `npx motia emit --topic my.topic --message '{"key": "value"}'`
  - `generate step`: `npx motia generate step -d steps/my-step`
  - `state list`: `npx motia state list` (shows file state).

**Prompt**: "Provide a CLI command to test an event step with topic `test.event`."

## Testing

- **Framework**: Jest (`@motiadev/testing`) for TS/JS. Use CLI `emit` or `curl` for Python/Ruby testing.
- **Command**: Include `curl` or `npx motia emit` with sample data.

**Example Test (TS)**:

```typescript
import { createTestContext } from '@motiadev/testing'
import { handler } from './my-step.step'

describe('MyStep', () => {
  it('emits event', async () => {
    const { emit, done } = createTestContext()
    await handler({ key: 'test' }, { emit })
    expect(emit).toHaveBeenCalledWith({ topic: 'my.event', data: { key: 'test' } })
    done()
  })
})
```

**Example Test Command (Python/Ruby)**:

```bash
npx motia emit --topic test.event --message '{"key": "value"}'
```

**Prompt**: "Generate a test command for an API step at `/test`."

## Workbench Customization

- **Access**: `npx motia dev` (runs at `http://localhost:3000`).
- **Features**: Flow visualization, real-time logs, testing.

### UI Steps (TS/JS Only)

- **Purpose**: Custom visuals for steps in Workbench.
- **Files**: `.ts` for config, `.tsx` for optional UI.

**Template (TS)**:

```typescript
// custom-ui.step.tsx
import React from 'react';
import { EventNode } from 'motia/workbench';
import type { EventNodeProps } from 'motia/workbench';

export default function CustomStep({ data }: EventNodeProps) {
  return (
    <EventNode data={data} variant="white" className="py-2 px-4">
      <div>Custom: {data.name}</div>
    </EventNode>
  );
}
```

**Components**:

- `EventNode`: For event steps (`variant`: "white", "ghost", "noop").
- `ApiNode`: For API steps.

**Prompt**: "Create a custom UI for an event step displaying its name."

## Best Practices

- **Naming**: Descriptive flow/step names (e.g., `user-registration-flow`).
- **Logging**: Structured (e.g., `logger.info('Done', { id: 1 })`).
- **State**:
  - Use dot notation (e.g., `booking.customer`).
  - Clean up with `clear(traceId)`.
- **Performance**: Batch state ops, monitor duration (`performance.now()`).
- **Testing**: Provide realistic sample data and responses.

## Complete Example: Data Processing Workflow

**Prompt**: "Build a workflow with an API step to receive data, an event step to process it, and a cron step to generate daily reports."

### API Step: Receive Data (JavaScript)

```javascript
// data-api.step.js
const config = {
  type: 'api',
  name: 'DataReceiver',
  description: 'Receives data for processing',
  path: '/data',
  method: 'POST',
  emits: ['data.received'],
  flows: ['data-processor'],
  bodySchema: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  }
}

const handler = async (req, { logger, emit }) => {
  logger.info('Data received', { body: req.body })
  try {
    await emit({ topic: 'data.received', data: req.body })
    return { status: 200, body: { message: 'Data accepted' } }
  } catch (error) {
    logger.error('Data processing error', { error: error.message })
    return { status: 500, body: { error: 'Failed' } }
  }
}

module.exports = { config, handler }
```

### API Step: Receive Data (TypeScript)

```typescript
// data-api.step.ts
import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'DataReceiver',
  description: 'Receives data for processing',
  path: '/data',
  method: 'POST',
  emits: ['data.received'],
  flows: ['data-processor'],
  bodySchema: z.object({ message: z.string() }),
  responseSchema: {
    200: z.object({ message: z.string() }),
    500: z.object({ error: z.string() }),
  },
};

export const handler: Handlers['DataReceiver'] = async (req, { logger, emit }) => {
  logger.info('Data received', { body: req.body });
  try {
    await emit({ topic: 'data.received', data: req.body });
    return { status: 200, body: { message: 'Data accepted' } };
  } catch (error) {
    logger.error('Data processing error', { error: error.message });
    return { status: 500, body: { error: 'Failed' } };
  }
};
```

### API Step: Receive Data (Python)
```python
# data_api_step.py
config = {
    'type': 'api',
    'name': 'DataReceiver',
    'description': 'Receives data for processing',
    'path': '/data',
    'method': 'POST',
    'emits': ['data.received'],
    'bodySchema': {
        'type': 'object',
        'properties': {
            'message': {'type': 'string'}
        },
        'required': ['message']
    },
    'flows': ['data-processor']
}

async def handler(req, ctx):
    ctx.logger.info('Data received', {'body': req.body})
    try:
        await ctx.emit({'topic': 'data.received', 'data': req.body})
        return {'status': 200, 'body': {'message': 'Data accepted'}}
    except Exception as error:
        ctx.logger.error('Data processing error', {'error': str(error)})
        return {'status': 500, 'body': {'error': 'Failed'}}
```

### API Step: Receive Data (Ruby)
```ruby
# data-api.step.rb
def config
  {
    type: 'api',
    name: 'DataReceiver',
    description: 'Receives data for processing',
    path: '/data',
    method: 'POST',
    emits: ['data.received'],
    bodySchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    flows: ['data-processor']
  }
end

def handler(req, ctx)
  ctx.logger.info('Data received', { body: req.body })
  begin
    ctx.emit({ topic: 'data.received', data: req.body })
    { status: 200, body: { message: 'Data accepted' } }
  rescue StandardError => error
    ctx.logger.error('Data processing error', { error: error.message })
    { status: 500, body: { error: 'Failed' } }
  end
end
```

### Event Step: Process Data (JavaScript)

```javascript
// data-processor.step.js
const config = {
  type: 'event',
  name: 'DataProcessor',
  description: 'Processes received data',
  subscribes: ['data.received'],
  emits: ['data.processed'],
  input: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  },
  flows: ['data-processor']
}

const handler = async (input, { logger, emit, state, traceId }) => {
  logger.info('Processing data', { input })
  try {
    const result = input.message.includes('important') ? 'high-priority' : 'normal'
    await state.set(traceId, 'priority', result)
    await emit({ topic: 'data.processed', data: { priority: result } })
  } catch (error) {
    logger.error('Processing failed', { error: error.message })
  }
}

module.exports = { config, handler }
```

### Event Step: Process Data (TypeScript)
```typescript
// data-processor.step.ts
import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';

export const config: EventConfig = {
  type: 'event',
  name: 'DataProcessor',
  description: 'Processes received data',
  subscribes: ['data.received'],
  emits: ['data.processed'],
  input: z.object({ message: z.string() }),
  flows: ['data-processor']
};

export const handler: Handlers['DataProcessor'] = async (input, { logger, emit, state, traceId }) => {
  logger.info('Processing data', { input });
  try {
    const result = input.message.includes('important') ? 'high-priority' : 'normal';
    await state.set(traceId, 'priority', result);
    await emit({ topic: 'data.processed', data: { priority: result } });
  } catch (error) {
    logger.error('Processing failed', { error: error.message });
  }
};
```

### Event Step: Process Data (Python)
```python
# data_processor_step.py
config = {
    'type': 'event',
    'name': 'DataProcessor',
    'description': 'Processes received data',
    'subscribes': ['data.received'],
    'emits': ['data.processed'],
    'input': {
        'type': 'object',
        'properties': {
            'message': {'type': 'string'}
        },
        'required': ['message']
    },
    'flows': ['data-processor']
}

async def handler(input, ctx):
    ctx.logger.info('Processing data', {'input': input})
    try:
        result = 'high-priority' if 'important' in input['message'] else 'normal'
        await ctx.state.set(ctx.trace_id, 'priority', result)
        await ctx.emit({'topic': 'data.processed', 'data': {'priority': result}})
    except Exception as error:
        ctx.logger.error('Processing failed', {'error': str(error)})
```

### Event Step: Process Data (Ruby)
```ruby
# data-processor.step.rb
def config
  {
    type: 'event',
    name: 'DataProcessor',
    description: 'Processes received data',
    subscribes: ['data.received'],
    emits: ['data.processed'],
    input: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    },
    flows: ['data-processor']
  }
end

def handler(input, ctx)
  ctx.logger.info('Processing data', { input: input })
  begin
    result = input[:message].include?('important') ? 'high-priority' : 'normal'
    ctx.state.set(ctx.trace_id, 'priority', result)
    ctx.emit({ topic: 'data.processed', data: { priority: result } })
  rescue StandardError => error
    ctx.logger.error('Processing failed', { error: error.message })
  end
end
```


### Cron Step: Daily Report (JavaScript)

```javascript
// daily-report.step.js
const config = {
  type: 'cron',
  name: 'DailyReporter',
  description: 'Generates daily reports at 9 AM',
  cron: '0 9 * * *',
  emits: ['report.generated'],
  flows: ['data-processor']
}

const handler = async (_, { logger, emit, state, traceId }) => {
  logger.info('Generating daily report')
  try {
    const priority = await state.get(traceId, 'priority') || 'unknown'
    await emit({ topic: 'report.generated', data: { priority, date: new Date().toISOString() } })
    await state.clear(traceId)
    logger.info('Report completed')
  } catch (error) {
    logger.error('Report failed', { error: error.message })
  }
}

module.exports = { config, handler }
```

### Cron Step: Daily Report (TypeScript)
```typescript
// daily-report.step.ts
import { CronConfig, Handlers } from 'motia';

export const config: CronConfig = {
  type: 'cron',
  name: 'DailyReporter',
  description: 'Generates daily reports at 9 AM',
  cron: '0 9 * * *',
  emits: ['report.generated'],
  flows: ['data-processor']
};

export const handler: Handlers['DailyReporter'] = async (_, { logger, emit, state, traceId }) => {
  logger.info('Generating daily report');
  try {
    const priority = await state.get<string>(traceId, 'priority') || 'unknown';
    await emit({ topic: 'report.generated', data: { priority, date: new Date().toISOString() } });
    await state.clear(traceId);
    logger.info('Report completed');
  } catch (error) {
    logger.error('Report failed', { error: error.message });
  }
};
```

### Cron Step: Daily Report (Python)
```python
# daily_report_step.py
import datetime

config = {
    'type': 'cron',
    'name': 'DailyReporter',
    'description': 'Generates daily reports at 9 AM',
    'cron': '0 9 * * *',
    'emits': ['report.generated'],
    'flows': ['data-processor']
}

async def handler(input, ctx):
    ctx.logger.info('Generating daily report')
    try:
        priority = await ctx.state.get(ctx.trace_id, 'priority') or 'unknown'
        await ctx.emit({'topic': 'report.generated', 'data': {'priority': priority, 'date': datetime.datetime.now().isoformat()}})
        await ctx.state.clear(ctx.trace_id)
        ctx.logger.info('Report completed')
    except Exception as error:
        ctx.logger.error('Report failed', {'error': str(error)})
```

### Cron Step: Daily Report (Ruby)
```ruby
# daily-report.step.rb
def config
  {
    type: 'cron',
    name: 'DailyReporter',
    description: 'Generates daily reports at 9 AM',
    cron: '0 9 * * *',
    emits: ['report.generated'],
    flows: ['data-processor']
  }
end

def handler(_, ctx)
  ctx.logger.info('Generating daily report')
  begin
    priority = ctx.state.get(ctx.trace_id, 'priority') || 'unknown'
    ctx.emit({ topic: 'report.generated', data: { priority: priority, date: Time.now.iso8601 } })
    ctx.state.clear(ctx.trace_id)
    ctx.logger.info('Report completed')
  rescue StandardError => error
    ctx.logger.error('Report failed', { error: error.message })
  end
end
```


### Example Usage

```bash
# Test API
curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -d '{"message": "This is important data"}'

# Test Event (manual trigger)
npx motia emit --topic data.received --message '{"message": "This is important data"}'

# Expected Logs
[INFO] Data received: {"message": "This is important data"}
[INFO] Processing data: {"message": "This is important data"}
[INFO] Generating daily report (at 9 AM)
[INFO] Report completed
```
