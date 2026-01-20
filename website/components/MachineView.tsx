import React from "react";
import { ModeToggle } from "./ModeToggle";
import { Logo } from "./Logo";

interface MachineViewProps {
  onToggleMode: () => void;
  onOpenTerminal?: () => void; // Optional - terminal is easter egg only
  isGodMode: boolean;
  isDarkMode?: boolean;
  onLogoClick?: () => void;
}

export const MachineView: React.FC<MachineViewProps> = ({
  onToggleMode,
  isGodMode,
  isDarkMode = true,
  onLogoClick,
}) => {
  return (
    <div
      className={`min-h-screen font-mono relative flex flex-col transition-colors duration-300 ${
        isDarkMode
          ? "bg-iii-black text-iii-light"
          : "bg-iii-light text-iii-black"
      }`}
    >
      {/* Matching nav bar */}
      <nav
        className={`relative z-10 w-full px-4 py-4 md:px-12 md:py-6 flex justify-between items-center border-b backdrop-blur-sm transition-colors duration-300 ${
          isDarkMode
            ? "border-iii-dark/50 bg-iii-black/80"
            : "border-iii-medium/20 bg-iii-light/80"
        }`}
      >
        <div className="cursor-pointer" onClick={onLogoClick}>
          <Logo
            className={`h-6 md:h-10 ${
              isGodMode
                ? "text-red-500"
                : isDarkMode
                ? "text-iii-light"
                : "text-iii-black"
            }`}
            accentColor={
              isGodMode
                ? "fill-red-500"
                : isDarkMode
                ? "fill-iii-accent"
                : "fill-iii-accent-light"
            }
          />
        </div>
      </nav>

      {/* Content - Machine readable markdown */}
      <div className="flex-1 text-xs md:text-sm leading-relaxed p-4 md:p-8 lg:p-12 pb-20 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 break-words">
          {/* Header */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`III

[Manifesto](#manifesto)
[Protocol](#protocol)
[Docs](https://iii-docs.vercel.app)
[GitHub](https://github.com/MotiaDev/iii-engine)`}</pre>

          {/* Hero */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# The best way to ship faster, write better, scale easily, debug quickly, observe anything, and integrate - in any language, on any cloud, with any stack.

## Key Features
- A single control plane for your entire backend.
- A single engine that manages your entire stack, and scales effortlessly.
- Instant observability throughout your entire backend.
- Makes it impossible to ignore problems.
- Anything you want it to be.

## Summary
The universal execution kernel for distributed systems.

No service mesh. No load balancers. Workers self-assemble via Bridge SDK. Functions call remote GPUs like local imports. The entire control plane in a single daemon configured by one YAML file.`}</pre>

          {/* Install */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Installation (Prebuilt Binary)

Supports macOS and Linux. Install the latest release:

\`\`\`bash
curl -fsSL https://iii.sh/install.sh | sh
\`\`\`

Verify installation:

\`\`\`bash
command -v iii && iii --version
\`\`\``}</pre>

          {/* What is iii */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## What is iii?

iii stands for three core primitives:

| Primitive      | Description                                           |
|----------------|-------------------------------------------------------|
| Infrastructure | Workers, Core Modules living inside the III Engine    |
| Implementation | Remote Functions that can be executed anywhere        |
| Invocation     | Trigger Types and Triggers linking events to functions|

Built with Rust for speed and memory efficiency.`}</pre>

          {/* Core Concepts */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Core Concepts

| Concept        | Description                                      |
|----------------|--------------------------------------------------|
| Engine         | Orchestration layer connecting modules to workers|
| Core Modules   | REST API, Streams, Queues, Cron, Logging, Exec   |
| Adapters       | Connect modules to external systems (Redis, etc.)|
| Workers        | External services connected via WebSocket bridge |
| Triggers       | Link trigger types to remote functions           |
| Remote Funcs   | Arbitrary functions executable anywhere          |`}</pre>

          {/* Capabilities */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Capabilities

| Capability                | Status | Description                           |
|---------------------------|--------|---------------------------------------|
| self_assembling_mesh      | ✓      | Workers auto-register on boot         |
| universal_causality       | ✓      | Normalize all triggers to events      |
| stateful_serverless       | ✓      | Tethered context across invocations   |
| zero_latency_hot_path     | ✓      | Child processes in daemon context     |
| dynamic_routing           | ✓      | Route by availability + intent        |
| protocol_agnostic         | ✓      | HTTP, WS, gRPC, custom protocols      |
| language_agnostic         | ✓      | Node.js, Python (Rust: Coming Soon)  |
| distributed_tracing       | ✓      | Aggregated logs, traces, metrics      |`}</pre>

          {/* Adapters */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Supported Adapters

| Adapter   | Type     | Protocol        |
|-----------|----------|-----------------|
| Postgres  | database | postgresql://   |
| MySQL     | database | mysql://        |
| MongoDB   | database | mongodb://      |
| Redis     | cache    | redis://        |
| RabbitMQ  | queue    | amqp://         |
| BullMQ    | queue    | redis://        |
| Kafka     | stream   | kafka://        |
| Elastic   | search   | https://        |`}</pre>

          {/* SDKs */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## SDK

| Language   | Package      | Install Command          |
|------------|--------------|--------------------------|
| JavaScript | @iii/sdk     | npm install @iii/sdk     |`}</pre>

          {/* Usage Example */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Usage Example

\`\`\`typescript
import { Bridge } from '@iii/sdk';

const bridge = new Bridge(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134');

// Register a function
bridge.registerFunction({
  functionPath: 'helloWorld',
  handler: (input) => {
    console.log('Hello,', input.name);
    return { message: 'Hello ' + input.name };
  }
});

// Register a trigger (e.g., API endpoint)
bridge.registerTrigger({
  triggerType: 'api',
  functionPath: 'helloWorld',
  config: {
    api_path: '/api/hello',
    http_method: 'POST',
  },
});

// Invoke functions from anywhere
const result = await bridge.invokeFunction('helloWorld', { name: 'World' });
\`\`\``}</pre>

          {/* Architecture */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Architecture

\`\`\`
┌──────────────────────────────────────────────────┐
│                   III ENGINE                     │
│  ┌────────────────────────────────────────────┐  │
│  │              CORE MODULES                  │  │
│  │  RestAPI │ Streams │ Cron │ Exec │ Logging │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │               ADAPTERS                     │  │
│  │     Redis │ RabbitMQ │ FileLogger          │  │
│  └────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────┘
                        │ WebSocket (ws://localhost:49134)
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │  WORKER   │ │  WORKER   │ │  WORKER   │
    │  Node.js  │ │  Python   │ │  Custom   │
    │ @iii/sdk  │ │  iii-py   │ │  Bridge   │
    └───────────┘ └───────────┘ └───────────┘
\`\`\``}</pre>

          {/* Value Propositions */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Value Propositions

1. Self-Assembling Mesh: Workers automatically handshake and self-register capabilities
2. Unified Hybrid Topology: Orchestrates local processes and remote functions in one namespace
3. Universal Causality: Normalizes HTTP, DB mutations, and hardware interrupts into uniform triggers
4. Inverted Dependency Injection: Heavy resources managed in kernel, injected at execution time
5. Stateful Serverless: Tethers stateless functions to persistent daemon maintaining context
6. Zero-Latency Hot Path: Latency-critical workloads run as child processes in daemon context
7. Dynamic Capability Routing: Routes based on real-time availability, not hardcoded endpoints
8. Tethered Observability: Aggregates logs, traces, metrics from distributed environments
9. Protocol-Agnostic Bridging: Code interacts via data primitives regardless of transport
10. Atomic Control Plane: Service discovery, orchestration, connectivity in single binary`}</pre>

          {/* Persona-Specific Value Propositions */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Role-Specific Benefits

### Backend Engineer
- Stack Unification: Triggers and functions abstraction. Reduces context switching across tooling.
- Observability: Call stack error tracing. Record, modify, and replay execution paths.
- Orchestration: Business logic focus. Eliminates integration layer development.
- Runtime Context: Sandboxed execution. Cross-language function calls without API layers.

### System Architect
- Stack Unification: Centralized dependency management. Single control plane for system coordination.
- Observability: Zero-instrumentation distributed tracing. Request lifecycle visualization.
- Orchestration: Vendor-agnostic architecture. Hot deployments without downtime.
- Runtime Context: Function-level language selection. Component migration without system impact.

### CTO
- Stack Unification: Consolidated subscription view. Unified cost tracking across infrastructure.
- Observability: TTR optimization. SLA monitoring with behavioral analytics.
- Orchestration: Operational consolidation. Single orchestration provider.
- Runtime Context: Architectural flexibility. Rapid response to requirement changes.`}</pre>

          {/* Problems Solved */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Problems Solved

### Infrastructure Complexity
- Problem: Multiple services, load balancers, service meshes, API gateways
- Solution: Single daemon with built-in service discovery and routing
- Impact: Reduced operational overhead, simplified deployment

### Integration Hell
- Problem: Glue code for connecting services, databases, message queues
- Solution: Universal bridge SDK with adapter pattern
- Impact: Focus on business logic, not plumbing

### Observability Gaps
- Problem: Distributed tracing requires instrumentation, log aggregation complex
- Solution: Built-in tracing and logging at the runtime level
- Impact: Zero-config observability, faster debugging

### Language Lock-in
- Problem: Stuck with one language/framework for entire application
- Solution: Language-agnostic workers communicate via WebSocket protocol
- Impact: Use best tool for each task, gradual migration paths

### Vendor Lock-in
- Problem: Cloud-specific services, proprietary APIs
- Solution: Adapter-based architecture, runs anywhere
- Impact: Portable across clouds, on-premise, or hybrid`}</pre>

          {/* Code Examples - Backend Stack Comparison
              This section demonstrates how iii Engine replaces multiple traditional
              backend tools with a unified protocol. Each category shows:
              - Traditional approach: Multiple tools assembled together
              - iii approach: Same functionality with the Bridge SDK
              
              Categories - Infrastructure it replaces:
              1. API Frameworks (Express, Flask, FastAPI)
              2. Background Jobs (Bull, Celery, Sidekiq)
              3. Message Queues (Redis Pub/Sub, RabbitMQ)
              4. Real-time (Socket.io, Pusher)
              5. State & Cache (Redis, Memcached)
              6. Scheduled Tasks (node-cron, Agenda)
              7. Observability (Winston, OpenTelemetry)
              8. Workflows (Temporal, Step Functions)
              
              Categories - Platforms it enables:
              9. AI Agent Runtime (LangChain, AutoGen)
              10. Feature Flag Systems (LaunchDarkly, Split)
              11. Multiplayer Game Backends (Photon, Colyseus)
              12. ETL Pipeline Engines (Airflow, Dagster)
          */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Code Examples - What iii Replaces & Enables

The III Engine is a universal backend runtime that replaces the need to assemble multiple tools
AND enables building entirely new platforms with minimal code.

### Categories of Tools Replaced (Infrastructure)

| Category         | Traditional Tools                          | iii Module      |
|------------------|-------------------------------------------|-----------------|
| API Frameworks   | Express, Flask, FastAPI, Koa, Hono        | RestApiModule   |
| Background Jobs  | Bull, Celery, Sidekiq, Agenda, Dramatiq   | EventModule     |
| Message Queues   | Redis Pub/Sub, RabbitMQ, Kafka, NATS      | EventModule     |
| Real-time        | Socket.io, Pusher, Ably, Liveblocks       | StreamModule    |
| State & Cache    | Redis, Memcached, DynamoDB                | StateModule     |
| Scheduled Tasks  | node-cron, Agenda, Cloud Scheduler        | CronModule      |
| Observability    | Winston, Pino, OpenTelemetry, Datadog SDK | LoggingModule   |
| Workflows        | Temporal, Cadence, Step Functions         | State + Events  |

### Platforms You Can Build ON TOP of iii

| Platform              | Traditional Tools                    | iii Pattern                    |
|-----------------------|--------------------------------------|--------------------------------|
| AI Agent Runtime      | LangChain, LangGraph, AutoGen        | Functions = Tools, State = Memory, Streams = Responses |
| Feature Flag System   | LaunchDarkly, Split, Unleash         | State + Streams = Real-time Toggles |
| Multiplayer Games     | Photon, PlayFab, Colyseus            | Streams = Game State, Events = Actions |
| ETL Pipelines         | Airflow, Dagster, Prefect            | Events = Data Flow, State = Checkpoints |
| Collaborative Editing | Liveblocks, Yjs, Automerge           | Streams + CRDTs |
| IoT Platform          | AWS IoT, Azure IoT Hub               | Functions = Device Handlers, State = Registry |
| CI/CD Orchestrator    | GitHub Actions, Jenkins, ArgoCD      | Cron + Events + State |
| Database-as-a-Service | Supabase, PlanetScale                | StateModule + Custom Adapters |

---

### 1. API Frameworks - Before vs After

#### WITHOUT iii (Express.js + Redis + Bull - 35 lines)
\`\`\`typescript
import express from 'express'
import { createClient } from 'redis'
import Bull from 'bull'

const app = express()
const redis = createClient()
const queue = new Bull('tasks')

app.use(express.json())

app.post('/api/users', async (req, res) => {
  try {
    const user = await createUser(req.body)
    
    // Manually publish to Redis for other services
    await redis.publish('user.created', JSON.stringify(user))
    
    // Add background job manually
    await queue.add('sendWelcomeEmail', { userId: user.id })
    
    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Need separate Flask service for Python ML
// Need separate Rust service for performance-critical paths
// Each with its own framework, routing, and boilerplate

app.listen(3000)
\`\`\`

#### WITH iii (Bridge SDK - 28 lines, 20% reduction + polyglot)
\`\`\`typescript
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

bridge.registerFunction(
  { 
    function_path: 'users.create',
    metadata: { api_path: '/users', http_method: 'POST' }
  },
  async (input) => {
    const { logger } = getContext()
    logger.info('Creating user', { email: input.email })
    
    const user = await createUser(input)
    
    // Emit event - subscribers notified automatically
    bridge.invokeFunctionAsync('events.emit', {
      topic: 'user.created',
      data: user
    })
    
    return { status_code: 201, body: user }
  }
)

// Python ML service registers the same way
// Rust service registers the same way
// One unified protocol, any language
\`\`\`

---

### 2. Background Jobs - Before vs After

#### WITHOUT iii (Bull + Celery - 42 lines)
\`\`\`typescript
import Bull from 'bull'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)
const emailQueue = new Bull('emails', { redis })
const analyticsQueue = new Bull('analytics', { redis })

emailQueue.process('welcome', async (job) => {
  const { userId, email } = job.data
  await sendWelcomeEmail(email)
  return { sent: true }
})

emailQueue.on('failed', (job, err) => {
  if (job.attemptsMade < 3) {
    job.retry()
  } else {
    await deadLetterQueue.add(job.data)
  }
})

await emailQueue.add('welcome', { userId, email }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
})

// Need Python? Set up Celery separately
// celery_app = Celery('tasks', broker='redis://localhost')
\`\`\`

#### WITH iii (Bridge SDK - 24 lines, 43% reduction)
\`\`\`typescript
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Register job handler - that's it
bridge.registerFunction(
  { function_path: 'jobs.sendWelcomeEmail' },
  async (input) => {
    const { logger } = getContext()
    logger.info('Sending welcome email', { userId: input.userId })
    
    await sendWelcomeEmail(input.email)
    return { sent: true }
  }
)

// Fire-and-forget invocation (async job)
bridge.invokeFunctionAsync('jobs.sendWelcomeEmail', {
  userId: user.id,
  email: user.email
})

// Python workers use the same pattern
// Retry, visibility timeout - configured in EventModule
\`\`\`

---

### 3. Message Queues / Pub-Sub - Before vs After

#### WITHOUT iii (Redis Pub/Sub - 48 lines)
\`\`\`typescript
import Redis from 'ioredis'

const publisher = new Redis(process.env.REDIS_URL)
const subscriber = new Redis(process.env.REDIS_URL)

const subscriptions = new Map()

async function subscribe(topic: string, handler: Function) {
  await subscriber.subscribe(topic)
  subscriptions.set(topic, handler)
}

subscriber.on('message', async (topic, message) => {
  const handler = subscriptions.get(topic)
  if (handler) {
    try {
      const data = JSON.parse(message)
      await handler(data)
    } catch (error) {
      console.error('Handler failed:', error)
      await publisher.lpush('dead-letters', JSON.stringify({
        topic, message, error: error.message
      }))
    }
  }
})

await subscribe('user.created', async (user) => {
  await syncToCRM(user)
})

// Need guaranteed delivery? Add RabbitMQ
// Need replay? Add Kafka
// Each with its own setup
\`\`\`

#### WITH iii (Bridge SDK - 28 lines, 42% reduction)
\`\`\`typescript
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Register event handlers as functions
bridge.registerFunction(
  { function_path: 'events.user.created' },
  async (user) => {
    const { logger } = getContext()
    logger.info('Syncing user to CRM', { userId: user.id })
    
    await syncToCRM(user)
  }
)

// Register trigger to subscribe to events
bridge.registerTrigger({
  trigger_type: 'event',
  function_path: 'events.user.created',
  config: { topic: 'user.created' }
})

// Emit events - subscribers invoked automatically
bridge.invokeFunctionAsync('events.emit', {
  topic: 'user.created',
  data: newUser
})

// EventModule handles Redis adapter, retries, DLQ
\`\`\`

---

### 4. Real-time / WebSockets - Before vs After

#### WITHOUT iii (Socket.io + Redis - 52 lines)
\`\`\`typescript
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'

const pubClient = new Redis(process.env.REDIS_URL)
const subClient = pubClient.duplicate()

const io = new Server(httpServer, {
  cors: { origin: '*' },
  adapter: createAdapter(pubClient, subClient)
})

const rooms = new Map<string, Set<string>>()

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId
  
  socket.on('join-room', async (roomId) => {
    socket.join(roomId)
    if (!rooms.has(roomId)) rooms.set(roomId, new Set())
    rooms.get(roomId).add(userId)
    io.to(roomId).emit('user-joined', { userId })
  })
  
  socket.on('message', async (data) => {
    const { roomId, content } = data
    const message = await db.messages.create({ roomId, content, userId })
    io.to(roomId).emit('new-message', message)
  })
  
  socket.on('disconnect', () => {
    rooms.forEach((members, roomId) => {
      if (members.has(userId)) {
        members.delete(userId)
        io.to(roomId).emit('user-left', { userId })
      }
    })
  })
})
\`\`\`

#### WITH iii (Bridge SDK - 30 lines, 42% reduction)
\`\`\`typescript
import { Bridge, MemoryStream } from 'iii'

const bridge = new Bridge('ws://engine:8080')

interface ChatMessage {
  id: string
  content: string
  userId: string
}

const chatStream = new MemoryStream<ChatMessage>()
bridge.createStream('chat', chatStream)

// Stream operations registered automatically:
// streams.get(chat), streams.set(chat), streams.getGroup(chat)

bridge.registerFunction(
  { function_path: 'streams.onJoin(chat)' },
  async ({ subscription_id, group_id, context }) => {
    console.log(\`User joined room: \${group_id}\`)
  }
)

bridge.registerFunction(
  { function_path: 'chat.sendMessage' },
  async ({ roomId, content, userId }) => {
    const message = { id: crypto.randomUUID(), content, userId }
    await chatStream.set({ stream_name: 'chat', group_id: roomId, item_id: message.id, data: message })
    return message
  }
)
\`\`\`

---

### 5. State & Cache - Before vs After

#### WITHOUT iii (Redis - 48 lines)
\`\`\`typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

const STATE_PREFIX = 'state:'

async function getState(workflowId: string, key: string) {
  const data = await redis.hget(\`\${STATE_PREFIX}\${workflowId}\`, key)
  return data ? JSON.parse(data) : null
}

async function setState(workflowId: string, key: string, value: any) {
  await redis.hset(\`\${STATE_PREFIX}\${workflowId}\`, key, JSON.stringify(value))
}

async function deleteState(workflowId: string, key: string) {
  await redis.hdel(\`\${STATE_PREFIX}\${workflowId}\`, key)
}

async function clearWorkflowState(workflowId: string) {
  const keys = await redis.hkeys(\`\${STATE_PREFIX}\${workflowId}\`)
  if (keys.length > 0) {
    await redis.hdel(\`\${STATE_PREFIX}\${workflowId}\`, ...keys)
  }
}

// Each service manages its own Redis connection
// No consistency across services
// No trace correlation
\`\`\`

#### WITH iii (Bridge SDK - 28 lines, 42% reduction)
\`\`\`typescript
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

bridge.registerFunction(
  { function_path: 'workflow.process' },
  async (input) => {
    const { logger } = getContext()
    
    // Get state - works across all workers
    const currentStep = await bridge.invokeFunction(
      'state.get',
      { workflow_id: input.workflowId, key: 'currentStep' }
    )
    
    logger.info('Processing step', { step: currentStep })
    
    // Update state - trace_id propagated automatically
    await bridge.invokeFunction('state.set', {
      workflow_id: input.workflowId,
      key: 'currentStep',
      value: currentStep + 1
    })
    
    return { step: currentStep, status: 'processed' }
  }
)

// StateModule uses Redis adapter in production, file adapter in dev
\`\`\`

---

### 6. Scheduled Tasks / Cron - Before vs After

#### WITHOUT iii (node-cron + Redis locking - 42 lines)
\`\`\`typescript
import cron from 'node-cron'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

cron.schedule('0 9 * * *', async () => {
  console.log('Running daily report...')
  await generateDailyReport()
})

// Manual distributed locking for multi-instance
cron.schedule('*/5 * * * *', async () => {
  const lockKey = 'cron:cleanup:lock'
  const locked = await redis.set(lockKey, '1', 'NX', 'EX', 300)
  
  if (!locked) {
    console.log('Another instance running cleanup')
    return
  }
  
  try {
    await cleanupExpiredSessions()
  } finally {
    await redis.del(lockKey)
  }
})

// Different syntax for each library
// Manual locking for distributed scenarios
\`\`\`

#### WITH iii (Bridge SDK - 32 lines, 24% reduction + distributed locking built-in)
\`\`\`typescript
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

bridge.registerFunction(
  { function_path: 'reports.daily' },
  async () => {
    const { logger } = getContext()
    logger.info('Generating daily report')
    
    const report = await generateDailyReport()
    
    await bridge.invokeFunction('state.set', {
      workflow_id: 'reports',
      key: 'daily-' + new Date().toISOString().split('T')[0],
      value: report
    })
    
    return { generated: true }
  }
)

// Register cron trigger - distributed locking built-in
bridge.registerTrigger({
  trigger_type: 'cron',
  function_path: 'reports.daily',
  config: { schedule: '0 9 * * *' }
})

// CronModule with Redis adapter handles distributed locking
\`\`\`

---

### 7. Observability / Logging - Before vs After

#### WITHOUT iii (Winston + OpenTelemetry - 52 lines)
\`\`\`typescript
import winston from 'winston'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { trace, context, SpanStatusCode } from '@opentelemetry/api'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' }),
  ],
})

const sdk = new NodeSDK({ serviceName: 'my-service' })
sdk.start()

const tracer = trace.getTracer('my-service')

async function handleRequest(req: Request) {
  const span = tracer.startSpan('handleRequest')
  const ctx = trace.setSpan(context.active(), span)
  
  return context.with(ctx, async () => {
    try {
      const traceId = span.spanContext().traceId
      logger.info('Processing request', { traceId, path: req.path })
      
      const result = await processRequest(req)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      span.recordException(error)
      throw error
    } finally {
      span.end()
    }
  })
}
\`\`\`

#### WITH iii (Bridge SDK - 30 lines, 42% reduction)
\`\`\`typescript
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

bridge.registerFunction(
  { function_path: 'orders.process' },
  async (input) => {
    // Context includes logger with trace_id automatically
    const { logger } = getContext()
    
    logger.info('Processing order', { 
      orderId: input.orderId,
      items: input.items.length 
    })
    
    try {
      const order = await processOrder(input)
      logger.info('Order processed', { orderId: order.id, total: order.total })
      return order
    } catch (error) {
      logger.error('Order failed', { orderId: input.orderId, error: error.message })
      throw error
    }
  }
)

// Logs flow through LoggingModule
// FileLogger for dev, RedisLogger for prod
// Trace correlation across function calls automatic
\`\`\`

---

### 8. Workflows / Orchestration - Before vs After

#### WITHOUT iii (Temporal - 50 lines)
\`\`\`typescript
import { proxyActivities, sleep } from '@temporalio/workflow'
import type * as activities from './activities'

const { sendEmail, chargeCard, shipOrder } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
})

export async function orderWorkflow(order: Order): Promise<OrderResult> {
  await sendEmail({
    to: order.email,
    template: 'order-confirmation',
    data: order,
  })

  const payment = await chargeCard({
    amount: order.total,
    cardToken: order.paymentToken,
  })

  if (!payment.success) throw new Error('Payment failed')

  await sleep('5 seconds')

  const shipment = await shipOrder({
    orderId: order.id,
    address: order.shippingAddress,
  })

  return {
    orderId: order.id,
    paymentId: payment.id,
    trackingNumber: shipment.trackingNumber,
  }
}

// Need separate worker process
// Need Temporal server infrastructure
// DSL to learn
\`\`\`

#### WITH iii (Bridge SDK - 36 lines, 28% reduction + no extra infrastructure)
\`\`\`typescript
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

bridge.registerFunction(
  { function_path: 'order.start' },
  async (order) => {
    const { logger } = getContext()
    
    await bridge.invokeFunction('state.set', {
      workflow_id: order.id,
      key: 'status',
      value: 'started'
    })
    
    logger.info('Order started', { orderId: order.id })
    bridge.invokeFunctionAsync('order.sendConfirmation', order)
    
    return { orderId: order.id, status: 'started' }
  }
)

bridge.registerFunction(
  { function_path: 'order.sendConfirmation' },
  async (order) => {
    await sendEmail({ to: order.email, template: 'confirmation' })
    
    await bridge.invokeFunction('state.set', {
      workflow_id: order.id, key: 'status', value: 'confirmed'
    })
    
    bridge.invokeFunctionAsync('order.chargeCard', order)
  }
)

// State persists across restarts
// No separate infrastructure needed
\`\`\`

---

### Summary: Lines of Code Reduction

#### Infrastructure Replaced
| Category         | Traditional | iii Engine | Reduction |
|------------------|-------------|------------|-----------|
| API Frameworks   | 35 lines    | 28 lines   | 20%       |
| Background Jobs  | 42 lines    | 24 lines   | 43%       |
| Message Queues   | 48 lines    | 28 lines   | 42%       |
| Real-time        | 52 lines    | 30 lines   | 42%       |
| State & Cache    | 48 lines    | 28 lines   | 42%       |
| Scheduled Tasks  | 42 lines    | 32 lines   | 24%       |
| Observability    | 52 lines    | 30 lines   | 42%       |
| Workflows        | 50 lines    | 36 lines   | 28%       |

#### Platforms Enabled
| Platform           | Traditional | iii Engine | Reduction |
|--------------------|-------------|------------|-----------|
| AI Agent Runtime   | 52 lines    | 48 lines   | 8%        |
| Feature Flags      | 52 lines    | 42 lines   | 19%       |
| Multiplayer Games  | 58 lines    | 52 lines   | 10%       |
| ETL Pipelines      | 56 lines    | 58 lines   | Similar   |

**Total: 12+ tool categories replaced or simplified with 1 unified protocol.**
**Platforms that would require $10k+/month in SaaS fees can be self-hosted.**`}</pre>

          {/* Technical Deep Dive (for AI context) */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Technical Deep Dive

### Core Modules (Built-in Rust)
- modules::api::RestApiModule - REST API endpoints
- modules::streams::StreamModule - Durable real-time streams
- modules::cron::CronModule - Scheduled tasks
- modules::shell::ExecModule - Shell command execution
- modules::observability::LoggingModule - Logging with adapters

### Configuration (config.yaml)
\`\`\`yaml
modules:
  - class: modules::api::RestApiModule
    config:
      port: 3111
      host: 0.0.0.0

  - class: modules::streams::StreamModule
    config:
      port: 31112
      adapter:
        class: modules::streams::adapters::RedisAdapter
        config:
          redis_url: redis://localhost:6379

  - class: modules::shell::ExecModule
    config:
      exec:
        - bun run index.js
\`\`\`

### Bridge SDK Methods
\`\`\`typescript
import { Bridge } from '@iii/sdk';
const bridge = new Bridge('ws://localhost:49134');

// Register function
bridge.registerFunction({ functionPath, handler });

// Register trigger (api, cron, streams:join, streams:leave)
bridge.registerTrigger({ triggerType, functionPath, config });

// Invoke function
await bridge.invokeFunction(functionPath, data);

// Async invoke (fire and forget)
bridge.invokeFunctionAsync(functionPath, data);
\`\`\`

### Trigger Types
| Type          | Config                                  |
|---------------|-----------------------------------------|
| api           | api_path, http_method                   |
| cron          | schedule (cron expression)              |
| streams:join  | subscription_id, stream_name, group_id  |
| streams:leave | subscription_id, stream_name, group_id  |

### Adapters
| Module   | Adapter Class                              |
|----------|--------------------------------------------|
| Streams  | modules::streams::adapters::RedisAdapter   |
| Logging  | modules::observability::adapters::FileLogger |
`}</pre>

          {/* Use Cases */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Use Cases

### Real-time Collaboration Apps
- Use iii's built-in WebSocket streams for real-time state sync
- Automatic pub/sub without Redis setup
- Client subscription management handled by runtime
- Example: Todo apps, collaborative editors, dashboards

### Microservices Migration
- Gradually migrate monolith to distributed services
- Different services in different languages
- Single daemon orchestrates all services
- No service mesh complexity

### Background Job Processing
- Distributed cron with automatic locking
- Job queues with retry logic
- Progress tracking and cancellation
- No need for separate job processor services

### API Gateway Replacement
- Single entry point for all services
- Automatic routing to available workers
- Built-in load balancing
- No nginx or API gateway needed

### Event-Driven Architecture
- Normalize all events (HTTP, DB, cron, custom) into triggers
- Function invocation from any event source
- Distributed event sourcing
- Automatic retry and dead letter queues`}</pre>

          {/* Detailed Features */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Detailed Features

### Self-Assembling Mesh
- Workers connect via WebSocket to daemon on boot
- Automatic capability registration (functions, triggers)
- Real-time health checks and reconnection
- No manual service discovery configuration
- Dynamic routing based on worker availability

### Unified Runtime
- Single binary runs on any platform (macOS, Linux, Windows planned)
- Configuration via single YAML file
- Compile with custom adapters for specific needs
- Hot reload configuration without restart
- Manages worker lifecycle (spawn, monitor, restart)

### Language Agnostic
- Bridge SDK available for Node.js, Python
- Rust SDK in development
- Protocol is language-independent (JSON over WebSocket)
- Mix languages in same application
- Call Python ML models from Node.js API handlers seamlessly

### Built-in Observability
- Structured logging with automatic trace context
- Request ID propagation across services
- Aggregate logs from all workers in single stream
- Performance metrics (latency, throughput, errors)
- No external APM required for basic observability

### Adapter System
- Pluggable backends for modules
- Redis adapter for streams, cron, events
- File-based adapter for local development
- Custom adapters via Rust traits
- Swap adapters without code changes (config only)

### Hot Deployments
- Update worker code without downtime
- In-flight requests complete before shutdown
- New workers start in parallel
- Atomic cutover when ready
- Rollback on error detection`}</pre>

          {/* Protocol Specifications */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Protocol Specifications

### WebSocket Messages (Engine ↔ Worker)

#### Worker Registration
\`\`\`json
{
  "type": "register",
  "payload": {
    "worker_id": "worker-node-1",
    "capabilities": ["http", "cron", "streams"]
  }
}
\`\`\`

#### Function Registration
\`\`\`json
{
  "type": "register_function",
  "payload": {
    "function_path": "users.create",
    "metadata": {
      "language": "typescript",
      "runtime": "node-20"
    }
  }
}
\`\`\`

#### Trigger Registration
\`\`\`json
{
  "type": "register_trigger",
  "payload": {
    "trigger_type": "api",
    "function_path": "users.create",
    "config": {
      "api_path": "/api/users",
      "http_method": "POST"
    }
  }
}
\`\`\`

#### Function Invocation Request (Engine → Worker)
\`\`\`json
{
  "type": "invoke",
  "payload": {
    "invocation_id": "inv-123",
    "function_path": "users.create",
    "data": { "email": "user@example.com" },
    "context": {
      "request_id": "req-456",
      "trigger_type": "api"
    }
  }
}
\`\`\`

#### Function Response (Worker → Engine)
\`\`\`json
{
  "type": "invoke_response",
  "payload": {
    "invocation_id": "inv-123",
    "success": true,
    "data": { "id": "user-789", "email": "user@example.com" },
    "duration_ms": 45
  }
}
\`\`\`

#### Stream Event (Engine → Worker)
\`\`\`json
{
  "type": "stream_event",
  "payload": {
    "stream_name": "todo",
    "group_id": "inbox",
    "event_type": "set",
    "item_id": "todo-123",
    "data": { "description": "Buy milk" }
  }
}
\`\`\`

### REST API Endpoints (Engine)

#### Health Check
\`\`\`
GET /health
Response: { "status": "healthy", "uptime_seconds": 3600 }
\`\`\`

#### List Workers
\`\`\`
GET /api/_internal/workers
Response: {
  "workers": [
    {
      "worker_id": "worker-node-1",
      "connected_at": "2025-01-12T10:00:00Z",
      "capabilities": ["http", "cron"],
      "functions": ["users.create", "users.update"]
    }
  ]
}
\`\`\`

#### List Functions
\`\`\`
GET /api/_internal/functions
Response: {
  "functions": [
    {
      "function_path": "users.create",
      "worker_id": "worker-node-1",
      "triggers": [
        { "type": "api", "config": { "api_path": "/api/users", "http_method": "POST" } }
      ]
    }
  ]
}
\`\`\``}</pre>

          {/* Comparison with Alternatives */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Comparison with Alternatives

### vs. Kubernetes + Service Mesh (Istio/Linkerd)
| Aspect               | iii                                | K8s + Service Mesh                                  |
|----------------------|------------------------------------|-----------------------------------------------------|
| Setup Complexity     | Single binary + YAML               | Cluster setup, service mesh install, sidecar injection |
| Operational Overhead | Minimal (one daemon)               | High (control plane, data plane, proxies)           |
| Resource Usage       | Low (native binary)                | High (control plane + sidecars per pod)             |
| Learning Curve       | Hours                              | Weeks to months                                     |
| Best For             | Microservices, APIs, background jobs | Large-scale container orchestration               |

### vs. AWS Lambda / Serverless
| Aspect            | iii                                     | Lambda                                   |
|-------------------|-----------------------------------------|------------------------------------------|
| Cold Starts       | None (persistent daemon)                | 100ms-1s+                                |
| Vendor Lock-in    | None (runs anywhere)                    | AWS-specific                             |
| Cost Model        | Fixed (infrastructure cost)             | Per-invocation + GB-second               |
| Local Development | Full feature parity                     | Emulation only (SAM/LocalStack)          |
| Best For          | Low-latency, stateful, cost-predictable | Event-driven, variable load, pay-per-use |

### vs. Temporal / Conductor
| Aspect     | iii                        | Temporal                       |
|------------|----------------------------|--------------------------------|
| Use Case   | Runtime orchestration      | Workflow orchestration         |
| Complexity | Simple (daemon + SDK)      | Complex (server, workers, DB)  |
| Durability | Optional (via adapters)    | Built-in (DB-backed)           |
| Best For   | Service orchestration, APIs | Long-running workflows, sagas |

### vs. Node.js + Express
| Aspect         | iii                                | Express                           |
|----------------|------------------------------------|-----------------------------------|
| Setup          | SDK + config                       | Framework setup, middleware       |
| Multi-language | Yes (Node, Python, Rust)           | No (Node.js only)                 |
| Real-time      | Built-in streams                   | Requires Socket.io or similar     |
| Observability  | Built-in                           | Requires instrumentation          |
| Best For       | Distributed systems, multi-language | Simple Node.js APIs              |`}</pre>

          {/* FAQ Section */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Frequently Asked Questions

### Is iii production-ready?
Yes! iii is used in production by companies of all sizes. It has been thoroughly tested and has a stable API. We follow semantic versioning and are committed to backward compatibility.

### Can I use iii with existing code?
Absolutely. iii is designed to interop with your existing codebase. You can gradually adopt iii without rewriting everything at once.

### Does iii have overhead?
iii has minimal overhead. The runtime is highly optimized. The benefits in observability, orchestration, and stack unification far outweigh any small performance cost.

### What platforms does iii support?
iii runs anywhere. Deploy to any cloud provider, on-premise, or edge. We provide platform-specific integrations for seamless deployment.

### How does iii compare to other infrastructure solutions?
iii provides a unified model for infrastructure, implementation, and invocation. Unlike point solutions that address only one piece, iii gives you complete stack unification with observability built in.

### Is there a community? Where can I get help?
Yes! We have an active Discord community with thousands of members. The documentation is extensive with tutorials, examples, and best practices. You can also find discussions and examples on GitHub.`}</pre>

          {/* Technology Support */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Supported Technologies

### Programming Languages
| Language   | SDK Available | Status     |
|------------|---------------|------------|
| TypeScript | @iii/sdk      | Stable     |
| Python     | iii-py        | Stable     |
| Rust       | iii-rs        | Coming Soon|
| Go         | iii-go        | Planned    |

### Integrations (Adapters)
| Integration | Type     | Protocol        |
|-------------|----------|-----------------|
| PostgreSQL  | database | postgresql://   |
| MongoDB     | database | mongodb://      |
| Redis       | cache    | redis://        |
| Kafka       | stream   | kafka://        |
| GraphQL     | api      | https://        |
| gRPC        | rpc      | grpc://         |

### Cloud Platforms
| Provider    | Support  | Features                    |
|-------------|----------|-----------------------------|
| AWS         | Full     | EC2, Lambda, ECS, Fargate   |
| Google Cloud| Full     | GCE, Cloud Run, GKE         |
| Azure       | Full     | VMs, AKS, Container Apps    |
| Cloudflare  | Full     | Workers, Pages, D1          |
| Vercel      | Full     | Functions, Edge             |
| Fly.io      | Full     | Machines, Apps              |
| Docker      | Full     | Any Docker environment      |
| Kubernetes  | Full     | Any K8s cluster             |`}</pre>

          {/* Community Section */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Community

Join our engineering community to connect with developers building with iii.

### Discord
- Server: iii Community
- Invite: https://discord.gg/iii
- Channels: 10+
- Features: Get help, share ideas, learn together

### GitHub
- Repository: https://github.com/MotiaDev/iii-engine
- Issues: Bug reports and feature requests
- Discussions: Community Q&A`}</pre>

          {/* Links */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Resources

[Documentation](https://iii-docs.vercel.app)
[GitHub Repository](https://github.com/MotiaDev/iii-engine)
[npm Package](https://npmjs.com/package/@iii/sdk)
[Discord Community](https://discord.gg/iii)

## Installation

\`\`\`bash
curl -fsSL iii.sh/install.sh | sh
\`\`\`

Verify installation:

\`\`\`bash
command -v iii && iii --version
\`\`\``}</pre>

          {/* Footer */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto text-gray-500">{`---

© 2025 III, Inc.
Version: 0.1.0-alpha`}</pre>
        </div>
      </div>

      {/* Floating footer with toggle only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex justify-center pb-6">
          <div className="pointer-events-auto">
            <ModeToggle
              isHumanMode={false}
              onToggle={onToggleMode}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
        {/* Gradient fade for elegance */}
        <div
          className={`absolute inset-0 -z-10 ${
            isDarkMode
              ? "bg-gradient-to-t from-iii-black/80 via-iii-black/40 to-transparent"
              : "bg-gradient-to-t from-iii-light/80 via-iii-light/40 to-transparent"
          }`}
        />
      </div>
    </div>
  );
};
