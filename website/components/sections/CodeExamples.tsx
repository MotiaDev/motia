export interface CodeExample {
  traditional: {
    title: string;
    tools: string[];
    code: string;
    language: string;
  };
  iii: {
    title: string;
    code: string;
    language: string;
  };
  description: string;
  linesTraditional: number;
  linesIII: number;
}

export const codeExamples: Record<string, CodeExample> = {
  api: {
    description:
      "Build HTTP APIs without framework lock-in. One codebase, any language.",
    traditional: {
      title: "Express + Flask + FastAPI",
      tools: ["Express.js", "Flask", "FastAPI", "Koa", "Hono"],
      language: "typescript",
      code: `// Express.js setup - just for HTTP routing
import express from 'express'
import { createClient } from 'redis'
import Bull from 'bull'

const app = express()
const redis = createClient()
const queue = new Bull('tasks')

app.use(express.json())

// Manual route registration
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

app.listen(3000)`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Language-agnostic API
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Register handler - works from any language
iii.registerFunction(
  { id: 'users::create' },
  async (req) => {
    const logger = new Logger()
    logger.info('Creating user', { email: req.body.email })

    const user = await createUser(req.body)

    // Publish event - subscribers notified automatically
    iii.triggerVoid('publish', {
      topic: 'user.created',
      data: user
    })

    return { status_code: 201, body: user }
  }
)

// Bind to HTTP - one line, any method, any path
iii.registerTrigger({
  type: 'http',
  function_id: 'users::create',
  config: { api_path: 'users', http_method: 'POST' }
})

// Python ML service registers the same way
// Rust service registers the same way
// One unified protocol, any language`,
    },
    linesTraditional: 35,
    linesIII: 32,
  },

  jobs: {
    description:
      "Background jobs without Sidekiq, Celery, or Bull. Just functions.",
    traditional: {
      title: "Bull + Celery + Sidekiq",
      tools: ["Bull", "BullMQ", "Celery", "Sidekiq", "Agenda", "Dramatiq"],
      language: "typescript",
      code: `// Bull queue setup
import Bull from 'bull'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)
const emailQueue = new Bull('emails', { redis })
const analyticsQueue = new Bull('analytics', { redis })
const reportQueue = new Bull('reports', { redis })

// Define processors separately
emailQueue.process('welcome', async (job) => {
  const { userId, email } = job.data
  await sendWelcomeEmail(email)
  return { sent: true }
})

emailQueue.process('notification', async (job) => {
  const { userId, message } = job.data
  await sendNotification(userId, message)
})

// Manual retry configuration
emailQueue.on('failed', (job, err) => {
  if (job.attemptsMade < 3) {
    job.retry()
  } else {
    await deadLetterQueue.add(job.data)
  }
})

// Add jobs from your API
await emailQueue.add('welcome', { userId, email }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: true,
})

// Need Python? Set up Celery separately
// celery_app = Celery('tasks', broker='redis://localhost')
// @celery_app.task(bind=True, max_retries=3)
// def send_email(self, user_id): ...`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Functions ARE the jobs
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Register job handler
iii.registerFunction(
  { id: 'jobs::sendWelcomeEmail' },
  async (input) => {
    const logger = new Logger()
    logger.info('Sending welcome email', { userId: input.userId })

    await sendWelcomeEmail(input.email)
    return { sent: true }
  }
)

// Bind function to a queue - one consumer per message
iii.registerTrigger({
  type: 'queue',
  function_id: 'jobs::sendWelcomeEmail',
  config: {
    topic: 'emails',
    metadata: {
      infrastructure: {
        queue: { maxRetries: 3, concurrency: 5 }
      }
    }
  }
})

// Enqueue a job - engine handles retries, DLQ
iii.triggerVoid('enqueue', {
  topic: 'emails',
  data: { userId: user.id, email: user.email }
})

// Python workers consume the same queue
// Retry, backoff, dead-letter - built into QueueModule`,
    },
    linesTraditional: 42,
    linesIII: 38,
  },

  events: {
    description:
      "Pub/Sub without RabbitMQ or Kafka. Events flow through the protocol.",
    traditional: {
      title: "Redis Pub/Sub + RabbitMQ",
      tools: ["Redis Pub/Sub", "RabbitMQ", "Kafka", "NATS", "AWS SQS"],
      language: "typescript",
      code: `// Redis Pub/Sub setup
import Redis from 'ioredis'

const publisher = new Redis(process.env.REDIS_URL)
const subscriber = new Redis(process.env.REDIS_URL)

// Separate connections for pub and sub
const subscriptions = new Map()

// Manual subscription management
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
      // Manual dead-letter logic
      await publisher.lpush('dead-letters', JSON.stringify({
        topic, message, error: error.message
      }))
    }
  }
})

// Publish events
async function publish(topic: string, data: any) {
  await publisher.publish(topic, JSON.stringify(data))
}

// Subscribe to events
await subscribe('user.created', async (user) => {
  await syncToCRM(user)
})

await subscribe('order.placed', async (order) => {
  await updateInventory(order)
  await notifyWarehouse(order)
})

// Need guaranteed delivery? Add RabbitMQ
// Need replay? Add Kafka
// Each with its own setup and mental model`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Events are function invocations
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Register event handlers as functions
iii.registerFunction(
  { id: 'events::user::created' },
  async (user) => {
    const logger = new Logger()
    logger.info('Syncing user to CRM', { userId: user.id })
    await syncToCRM(user)
  }
)

iii.registerFunction(
  { id: 'events::order::placed' },
  async (order) => {
    await updateInventory(order)
    await notifyWarehouse(order)
  }
)

// Subscribe functions to topics
iii.registerTrigger({
  type: 'subscribe',
  function_id: 'events::user::created',
  config: { topic: 'user.created' }
})

iii.registerTrigger({
  type: 'subscribe',
  function_id: 'events::order::placed',
  config: { topic: 'order.placed' }
})

// Publish events - all subscribers invoked automatically
iii.triggerVoid('publish', {
  topic: 'user.created',
  data: newUser
})`,
    },
    linesTraditional: 48,
    linesIII: 41,
  },

  realtime: {
    description:
      "WebSockets without Socket.io or Pusher. Streams are first-class.",
    traditional: {
      title: "Socket.io + Pusher",
      tools: ["Socket.io", "Pusher", "Ably", "Liveblocks", "PartyKit"],
      language: "typescript",
      code: `// Socket.io setup
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'

const pubClient = new Redis(process.env.REDIS_URL)
const subClient = pubClient.duplicate()

const io = new Server(httpServer, {
  cors: { origin: '*' },
  adapter: createAdapter(pubClient, subClient)
})

// Room management
const rooms = new Map<string, Set<string>>()

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId
  
  socket.on('join-room', async (roomId) => {
    socket.join(roomId)
    
    // Track membership manually
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
    }
    rooms.get(roomId).add(userId)
    
    // Broadcast presence
    io.to(roomId).emit('user-joined', { userId })
  })
  
  socket.on('message', async (data) => {
    const { roomId, content } = data
    
    // Save to database manually
    const message = await db.messages.create({ roomId, content, userId })
    
    // Broadcast to room
    io.to(roomId).emit('new-message', message)
  })
  
  socket.on('disconnect', () => {
    // Clean up room membership
    rooms.forEach((members, roomId) => {
      if (members.has(userId)) {
        members.delete(userId)
        io.to(roomId).emit('user-left', { userId })
      }
    })
  })
})`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Streams are built-in
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Create typed stream with in-memory store
const rooms = new Map<string, Map<string, any>>()

iii.createStream('chat', {
  get: async ({ group_id, item_id }) =>
    rooms.get(group_id)?.get(item_id) ?? null,
  set: async ({ group_id, item_id, data }) => {
    if (!rooms.has(group_id)) rooms.set(group_id, new Map())
    const old = rooms.get(group_id)!.get(item_id)
    rooms.get(group_id)!.set(item_id, data)
    return { old_value: old, new_value: data }
  },
  delete: async ({ group_id, item_id }) => {
    const old = rooms.get(group_id)?.get(item_id)
    rooms.get(group_id)?.delete(item_id)
    return { old_value: old }
  },
  list: async ({ group_id }) =>
    [...(rooms.get(group_id)?.values() ?? [])],
  listGroups: async () => [...rooms.keys()],
  update: async () => null,
})

// Handle join events via stream:join trigger
iii.registerFunction(
  { id: 'chat::onJoin' },
  async ({ subscription_id, group_id }) => {
    const logger = new Logger()
    logger.info(\`User joined room: \${group_id}\`)
  }
)

iii.registerTrigger({
  type: 'stream:join',
  function_id: 'chat::onJoin',
  config: { stream_name: 'chat' }
})

// Send message - broadcasts to all subscribers
iii.registerFunction(
  { id: 'chat::sendMessage' },
  async ({ roomId, content, userId }) => {
    const message = {
      id: crypto.randomUUID(),
      content,
      userId,
      timestamp: new Date().toISOString()
    }
    
    // Set in stream - subscribers notified automatically
    await iii.trigger('stream::set', {
      stream_name: 'chat',
      group_id: roomId,
      item_id: message.id,
      data: message
    })
    
    return message
  }
)`,
    },
    linesTraditional: 52,
    linesIII: 38,
  },

  state: {
    description:
      "Shared state without direct Redis. State is a first-class module.",
    traditional: {
      title: "Redis + Memcached",
      tools: ["Redis", "Memcached", "DynamoDB", "Upstash"],
      language: "typescript",
      code: `// Redis state management
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Manual key management
const STATE_PREFIX = 'state:'
const SESSION_PREFIX = 'session:'
const CACHE_PREFIX = 'cache:'

async function getState(workflowId: string, key: string) {
  const data = await redis.hget(\`\${STATE_PREFIX}\${workflowId}\`, key)
  return data ? JSON.parse(data) : null
}

async function setState(workflowId: string, key: string, value: any) {
  await redis.hset(
    \`\${STATE_PREFIX}\${workflowId}\`,
    key,
    JSON.stringify(value)
  )
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

// Session management - separate logic
async function getSession(sessionId: string) {
  const data = await redis.get(\`\${SESSION_PREFIX}\${sessionId}\`)
  return data ? JSON.parse(data) : null
}

async function setSession(sessionId: string, data: any, ttl: number) {
  await redis.setex(
    \`\${SESSION_PREFIX}\${sessionId}\`,
    ttl,
    JSON.stringify(data)
  )
}

// Each service manages its own Redis connection
// No consistency across services
// No trace correlation`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - State is a module
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Use StateModule - same API everywhere
iii.registerFunction(
  { id: 'workflow::process' },
  async (input) => {
    const logger = new Logger()

    // Get state - works across all workers
    const currentStep = await iii.trigger(
      'state::get',
      { scope: input.workflowId, key: 'currentStep' }
    )
    
    logger.info('Processing step', { step: currentStep })
    
    // Update state - trace_id propagated automatically
    await iii.trigger('state::set', {
      scope: input.workflowId,
      key: 'currentStep',
      value: currentStep + 1
    })

    // Continue workflow
    if (currentStep < 5) {
      iii.triggerVoid('workflow::process', {
        workflowId: input.workflowId
      })
    }
    
    return { step: currentStep, status: 'processed' }
  }
)

// StateModule uses Redis adapter in production
// File adapter in development
// Consistent API, pluggable backends`,
    },
    linesTraditional: 48,
    linesIII: 36,
  },

  cron: {
    description:
      "Scheduled tasks without node-cron or Agenda. Cron is a trigger type.",
    traditional: {
      title: "node-cron + Agenda",
      tools: ["node-cron", "Agenda", "AWS EventBridge", "Cloud Scheduler"],
      language: "typescript",
      code: `// node-cron + Agenda setup
import cron from 'node-cron'
import Agenda from 'agenda'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)
const agenda = new Agenda({ db: { address: process.env.MONGO_URL } })

// Simple cron - no distributed locking
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily report...')
  await generateDailyReport()
})

// Agenda for distributed - needs MongoDB
agenda.define('send-weekly-digest', async (job) => {
  const { userId } = job.attrs.data
  await sendWeeklyDigest(userId)
})

// Manual distributed locking for node-cron
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

// Schedule jobs
await agenda.start()
await agenda.every('1 week', 'send-weekly-digest', { userId: 123 })

// Different syntax for each library
// Manual locking for distributed scenarios
// No unified observability`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Cron is a trigger type
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Register the function
iii.registerFunction(
  { id: 'reports::daily' },
  async () => {
    const logger = new Logger()
    logger.info('Generating daily report')

    const report = await generateDailyReport()

    // Store in state for retrieval
    await iii.trigger('state::set', {
      scope: 'reports',
      key: 'daily-' + new Date().toISOString().split('T')[0],
      value: report
    })
    
    return { generated: true }
  }
)

// Register cron trigger - distributed locking built-in
iii.registerTrigger({
  type: 'cron',
  function_id: 'reports::daily',
  config: { expression: '0 9 * * *' } // 9am daily
})

// Cleanup job - CronModule handles locking
iii.registerFunction(
  { id: 'maintenance::cleanup' },
  async () => {
    await cleanupExpiredSessions()
  }
)

iii.registerTrigger({
  type: 'cron',
  function_id: 'maintenance::cleanup',
  config: { expression: '*/5 * * * *' } // Every 5 min
})`,
    },
    linesTraditional: 42,
    linesIII: 40,
  },

  logging: {
    description:
      "Observability without Datadog setup. Logging flows through the protocol.",
    traditional: {
      title: "Winston + Pino + Manual",
      tools: ["Winston", "Pino", "Bunyan", "OpenTelemetry", "Datadog SDK"],
      language: "typescript",
      code: `// Winston + OpenTelemetry setup
import winston from 'winston'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { trace, context, SpanStatusCode } from '@opentelemetry/api'

// Configure Winston
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

// Configure OpenTelemetry
const sdk = new NodeSDK({
  serviceName: 'my-service',
  // ... lots of configuration
})
sdk.start()

const tracer = trace.getTracer('my-service')

// Manual trace propagation
async function handleRequest(req: Request) {
  const span = tracer.startSpan('handleRequest')
  const ctx = trace.setSpan(context.active(), span)
  
  return context.with(ctx, async () => {
    try {
      const traceId = span.spanContext().traceId
      
      // Log with trace correlation - manually
      logger.info('Processing request', {
        traceId,
        path: req.path,
        method: req.method,
      })
      
      const result = await processRequest(req)
      
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR })
      span.recordException(error)
      logger.error('Request failed', { error: error.message })
      throw error
    } finally {
      span.end()
    }
  })
}`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Logging is built-in
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

iii.registerFunction(
  { id: 'orders::process' },
  async (input) => {
    // Context includes logger with trace_id
    const logger = new Logger()
    
    // Logs include trace_id + function id automatically
    logger.info('Processing order', { 
      orderId: input.orderId,
      items: input.items.length 
    })
    
    try {
      const order = await processOrder(input)
      
      // Log success
      logger.info('Order processed', { 
        orderId: order.id,
        total: order.total 
      })
      
      return order
    } catch (error) {
      // Error logged with full context
      logger.error('Order failed', { 
        orderId: input.orderId,
        error: error.message 
      })
      throw error
    }
  }
)

// Logs flow through LoggingModule
// FileLogger for dev, RedisLogger for prod
// Trace correlation across function calls
// Workbench visualizes everything`,
    },
    linesTraditional: 52,
    linesIII: 38,
  },

  workflow: {
    description:
      "Durable multi-step workflows without Temporal servers, Inngest DSL, or trigger.dev wrappers. State = durability. Queues = retries.",
    traditional: {
      title: "Temporal + Inngest + trigger.dev",
      tools: [
        "Temporal",
        "Inngest",
        "trigger.dev",
        "Cadence",
        "AWS Step Functions",
      ],
      language: "typescript",
      code: `// Temporal — the standard for durable execution
import { proxyActivities, sleep, ApplicationFailure } from '@temporalio/workflow'
import { Worker, NativeConnection } from '@temporalio/worker'
import type * as activities from './activities'

// All activities wrapped in proxyActivities — workflow must be deterministic
// No Date.now(), Math.random(), or direct DB/HTTP calls in workflow code
const { sendConfirmation, chargeCard, shipOrder } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 seconds',
  retry: { maximumAttempts: 3, backoffCoefficient: 2 },
})

export async function orderWorkflow(order: Order): Promise<OrderResult> {
  await sendConfirmation({ email: order.email, orderId: order.id })

  const payment = await chargeCard({
    amount: order.total,
    cardToken: order.paymentToken,
  })

  if (!payment.success) {
    throw ApplicationFailure.nonRetryable('Payment declined')
  }

  // Pause workflow — replay-safe delay
  await sleep('30 seconds')

  const shipment = await shipOrder({ orderId: order.id, address: order.address })

  return { orderId: order.id, trackingNumber: shipment.trackingNumber }
}

// Separate worker process — must deploy, scale, and monitor independently
const worker = await Worker.create({
  connection: await NativeConnection.connect({ address: 'temporal:7233' }),
  taskQueue: 'orders',
  workflowsPath: require.resolve('./workflows'),
  activities,
})
await worker.run()

// Temporal Cloud: $490+/month or self-host Temporal server
// Inngest: step.run() wraps every activity + cloud HTTP endpoint required
// trigger.dev: task.run() + server-side SDK + hosted infrastructure
// All: vendor DSL + vendor infrastructure + deterministic code constraints`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Durable workflows from plain functions
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// HTTP endpoint kicks off the workflow
iii.registerFunction(
  { id: 'order::start' },
  async (order) => {
    const logger = new Logger()

    await sendConfirmation({ email: order.email, orderId: order.id })

    // State write = durable checkpoint — survives restarts
    await iii.trigger('state::set', {
      scope: order.id, key: 'status', value: 'confirmed'
    })

    logger.info('Order confirmed', { orderId: order.id })

    // Enqueue next step — engine guarantees delivery
    iii.triggerVoid('enqueue', { topic: 'order.charge', data: order })
    return { status_code: 202, body: { orderId: order.id, status: 'confirmed' } }
  }
)
iii.registerTrigger({
  type: 'http',
  function_id: 'order::start',
  config: { api_path: 'orders', http_method: 'POST' }
})

// Queue trigger = at-least-once delivery + automatic retries on failure
iii.registerFunction(
  { id: 'order::charge' },
  async (order) => {
    const logger = new Logger()
    const payment = await chargeCard({ amount: order.total, token: order.paymentToken })

    if (!payment.success) {
      await iii.trigger('state::set', { scope: order.id, key: 'status', value: 'failed' })
      return
    }

    await iii.trigger('state::set', { scope: order.id, key: 'payment', value: payment })
    logger.info('Charged', { orderId: order.id, paymentId: payment.id })
    iii.triggerVoid('order::ship', order)
  }
)
iii.registerTrigger({
  type: 'queue',
  function_id: 'order::charge',
  config: {
    topic: 'order.charge',
    metadata: { infrastructure: { queue: { maxRetries: 3 } } }
  }
})

// Final step — state records completion
iii.registerFunction(
  { id: 'order::ship' },
  async (order) => {
    const logger = new Logger()
    const shipment = await shipOrder({ orderId: order.id, address: order.address })

    await iii.trigger('state::set', { scope: order.id, key: 'status', value: 'shipped' })
    logger.info('Shipped', { orderId: order.id, tracking: shipment.trackingNumber })
    return { orderId: order.id, trackingNumber: shipment.trackingNumber }
  }
)

// No DSL. No separate server. No determinism rules.
// State = durability. Queue = retries. Functions = steps.`,
    },
    linesTraditional: 48,
    linesIII: 55,
  },

  "ai-agents": {
    description:
      "Build AI agent runtimes without LangChain complexity. Functions as tools, State for memory, Streams for responses.",
    traditional: {
      title: "LangChain + LangGraph + Redis",
      tools: ["LangChain", "LangGraph", "LlamaIndex", "AutoGen", "CrewAI"],
      language: "typescript",
      code: `// LangChain agent setup with tools
import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents'
import { DynamicTool } from '@langchain/core/tools'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import Redis from 'ioredis'

const redis = new Redis()
const model = new ChatOpenAI({ modelName: 'gpt-4' })

// Define tools manually
const tools = [
  new DynamicTool({
    name: 'search_database',
    description: 'Search the product database',
    func: async (query: string) => {
      const results = await db.products.search(query)
      return JSON.stringify(results)
    },
  }),
  new DynamicTool({
    name: 'send_email',
    description: 'Send an email to user',
    func: async (params: string) => {
      const { to, subject, body } = JSON.parse(params)
      await sendEmail(to, subject, body)
      return 'Email sent'
    },
  }),
]

// Memory management manually
async function getConversationHistory(sessionId: string) {
  const history = await redis.lrange(\`chat:\${sessionId}\`, 0, -1)
  return history.map(h => JSON.parse(h))
}

async function saveMessage(sessionId: string, msg: any) {
  await redis.rpush(\`chat:\${sessionId}\`, JSON.stringify(msg))
  await redis.expire(\`chat:\${sessionId}\`, 3600)
}

// Create agent with prompt
const prompt = ChatPromptTemplate.fromMessages([/* ... */])
const agent = await createOpenAIToolsAgent({ llm: model, tools, prompt })
const executor = new AgentExecutor({ agent, tools })

// Execute with streaming... complex setup
const stream = await executor.streamEvents(
  { input: userMessage },
  { version: 'v1' }
)`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Functions ARE tools, State IS memory
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Register tools as functions - automatic discovery
iii.registerFunction(
  { 
    id: 'tools::searchDatabase',
    description: 'Search the product database',
    request_format: { name: 'query', type: 'string' }
  },
  async ({ query }) => {
    const results = await db.products.search(query)
    return { results }
  }
)

iii.registerFunction(
  { 
    id: 'tools::sendEmail',
    description: 'Send an email to user'
  },
  async ({ to, subject, body }) => {
    await sendEmail(to, subject, body)
    return { sent: true }
  }
)

// Agent orchestrator - uses StateModule for memory
iii.registerFunction(
  { id: 'agent::chat' },
  async ({ sessionId, message }) => {
    const logger = new Logger()

    // Get conversation history from StateModule
    const history = await iii.trigger('state::get', {
      scope: sessionId, key: 'history'
    }) || []
    
    // Call LLM with tools available via ListFunctions
    const response = await callLLM(message, history)
    
    // If tool call, trigger function directly
    if (response.toolCall) {
      const result = await iii.trigger(
        response.toolCall.function,
        response.toolCall.args
      )
      // Stream response back
      await iii.trigger('stream::set', {
        stream_name: 'chat', group_id: sessionId,
        item_id: 'response', data: result
      })
    }
    
    // Save to memory
    await iii.trigger('state::set', {
      scope: sessionId,
      key: 'history',
      value: [...history, { role: 'user', content: message }]
    })
    
    return response
  }
)`,
    },
    linesTraditional: 52,
    linesIII: 48,
  },

  "feature-flags": {
    description:
      "Real-time feature flags without LaunchDarkly or Split. State + Streams = instant propagation.",
    traditional: {
      title: "LaunchDarkly + Redis",
      tools: ["LaunchDarkly", "Split.io", "Unleash", "Flagsmith", "ConfigCat"],
      language: "typescript",
      code: `// LaunchDarkly setup
import * as LaunchDarkly from 'launchdarkly-node-server-sdk'
import Redis from 'ioredis'

const ldClient = LaunchDarkly.init(process.env.LD_SDK_KEY!)
const redis = new Redis()
const flagCache = new Map<string, any>()

// Wait for initialization
await ldClient.waitForInitialization()

// Subscribe to flag changes
ldClient.on('update', async (settings) => {
  // Manually sync to Redis for other services
  for (const [key, value] of Object.entries(settings)) {
    await redis.set(\`flag:\${key}\`, JSON.stringify(value))
    flagCache.set(key, value)
  }
  
  // Notify connected clients manually
  pubsub.publish('flag-updates', JSON.stringify(settings))
})

// Evaluate flag for user
async function getFlag(flagKey: string, user: User, defaultValue: any) {
  const ldUser = {
    key: user.id,
    email: user.email,
    custom: {
      plan: user.plan,
      createdAt: user.createdAt,
    },
  }
  
  const value = await ldClient.variation(flagKey, ldUser, defaultValue)
  
  // Track analytics manually
  await analytics.track('flag_evaluated', {
    flag: flagKey,
    value,
    userId: user.id,
  })
  
  return value
}

// Cleanup
process.on('SIGTERM', () => {
  ldClient.close()
})

// $25k+/year for enterprise features
// Vendor lock-in for flag definitions`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - State + Streams = Feature Flags
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Define flags in StateModule
iii.registerFunction(
  { id: 'flags::set' },
  async ({ flagKey, config }) => {
    const logger = new Logger()

    // Store flag config
    await iii.trigger('state::set', {
      scope: 'flags',
      key: flagKey,
      value: config
    })

    // Broadcast to all connected clients instantly
    iii.triggerVoid('publish', {
      topic: 'flags',
      data: { type: 'update', flag: flagKey, config }
    })
    
    logger.info('Flag updated', { flagKey })
    return { updated: true }
  }
)

// Evaluate flag
iii.registerFunction(
  { id: 'flags::evaluate' },
  async ({ flagKey, user, defaultValue }) => {
    const config = await iii.trigger('state::get', {
      scope: 'flags', key: flagKey
    })
    
    if (!config) return defaultValue
    
    // Evaluate targeting rules
    if (config.userIds?.includes(user.id)) return config.value
    if (config.percentage) {
      const hash = hashUser(user.id, flagKey)
      if (hash < config.percentage) return config.value
    }
    if (config.plans?.includes(user.plan)) return config.value
    
    return defaultValue
  }
)

// Client subscribes to flags stream for real-time updates
// No vendor, no monthly fee, full control`,
    },
    linesTraditional: 52,
    linesIII: 42,
  },

  multiplayer: {
    description:
      "Build multiplayer game backends without Photon or PlayFab. Streams for state, Events for actions.",
    traditional: {
      title: "Photon + PlayFab + Redis",
      tools: ["Photon", "PlayFab", "Nakama", "Colyseus", "Mirror"],
      language: "typescript",
      code: `// Colyseus game room setup
import { Room, Client } from 'colyseus'
import { Schema, MapSchema, type } from '@colyseus/schema'
import Redis from 'ioredis'

class Player extends Schema {
  @type('number') x: number = 0
  @type('number') y: number = 0
  @type('number') score: number = 0
}

class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>()
}

class GameRoom extends Room<GameState> {
  private redis = new Redis()
  
  onCreate(options: any) {
    this.setState(new GameState())
    this.setSimulationInterval(() => this.update())
    
    // Handle messages
    this.onMessage('move', (client, data) => {
      const player = this.state.players.get(client.sessionId)
      if (player) {
        player.x = data.x
        player.y = data.y
      }
    })
    
    this.onMessage('action', async (client, data) => {
      // Process action, update score
      const player = this.state.players.get(client.sessionId)
      player.score += data.points
      
      // Persist to Redis
      await this.redis.hset(
        \`game:\${this.roomId}:scores\`,
        client.sessionId,
        player.score
      )
    })
  }
  
  onJoin(client: Client) {
    this.state.players.set(client.sessionId, new Player())
    this.broadcast('playerJoined', { id: client.sessionId })
  }
  
  onLeave(client: Client) {
    this.state.players.delete(client.sessionId)
    this.broadcast('playerLeft', { id: client.sessionId })
  }
  
  update() {
    // Game loop logic
  }
}

// Need separate matchmaking service
// Need separate leaderboard service`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Streams for state, Events for actions
import { init } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Register game stream with in-memory store
const players = new Map<string, Map<string, any>>()
iii.createStream('game', {
  get: async ({ group_id, item_id }) =>
    players.get(group_id)?.get(item_id) ?? null,
  set: async ({ group_id, item_id, data }) => {
    if (!players.has(group_id)) players.set(group_id, new Map())
    const old = players.get(group_id)!.get(item_id)
    players.get(group_id)!.set(item_id, data)
    return { old_value: old, new_value: data }
  },
  delete: async ({ group_id, item_id }) => {
    const old = players.get(group_id)?.get(item_id)
    players.get(group_id)?.delete(item_id)
    return { old_value: old }
  },
  list: async ({ group_id }) =>
    [...(players.get(group_id)?.values() ?? [])],
  listGroups: async () => [...players.keys()],
  update: async () => null,
})

// Player joins - stream:join trigger
iii.registerFunction(
  { id: 'game::onJoin' },
  async ({ subscription_id, group_id }) => {
    await iii.trigger('stream::set', {
      stream_name: 'game', group_id,
      item_id: subscription_id,
      data: { x: 0, y: 0, score: 0 }
    })
    return { joined: true }
  }
)

iii.registerTrigger({
  type: 'stream:join',
  function_id: 'game::onJoin',
  config: { stream_name: 'game' }
})

// Handle player movement
iii.registerFunction(
  { id: 'game::move' },
  async ({ roomId, playerId, x, y }) => {
    const player = await iii.trigger('stream::get', {
      stream_name: 'game', group_id: roomId, item_id: playerId
    })

    await iii.trigger('stream::set', {
      stream_name: 'game', group_id: roomId,
      item_id: playerId,
      data: { ...player, x, y }
    })
  }
)

// Handle game action
iii.registerFunction(
  { id: 'game::action' },
  async ({ roomId, playerId, points }) => {
    const player = await iii.trigger('stream::get', {
      stream_name: 'game', group_id: roomId, item_id: playerId
    })

    await iii.trigger('stream::set', {
      stream_name: 'game', group_id: roomId,
      item_id: playerId,
      data: { ...player, score: player.score + points }
    })
    
    // Leaderboard update via event
    iii.triggerVoid('leaderboard::update', {
      playerId, score: player.score + points
    })
  }
)`,
    },
    linesTraditional: 58,
    linesIII: 52,
  },

  etl: {
    description:
      "Build ETL pipelines without cron jobs and manual checkpointing. Events for data flow, State for recovery points.",
    traditional: {
      title: "node-cron + Redis + Manual Workers",
      tools: ["node-cron", "Airflow", "Dagster", "Prefect", "Luigi"],
      language: "typescript",
      code: `// Manual ETL pipeline — node-cron + Redis checkpoints
import cron from 'node-cron'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

async function extractUsers() {
  const checkpoint = await redis.get('etl:checkpoint')
  return db.users.find({
    updated_at: { $gt: checkpoint ? new Date(checkpoint) : new Date(0) }
  })
}

// No stage isolation — one big function, fail = restart everything
cron.schedule('0 2 * * *', async () => {
  try {
    // Extract
    const users = await extractUsers()

    // Transform
    const transformed = users.map(user => ({
      user_id: user.id,
      lifetime_value: calculateLTV(user),
      segment: classifySegment(user),
    }))

    // Load
    await warehouse.bulkInsert('user_analytics', transformed)

    // Save checkpoint — only after full success
    await redis.set('etl:checkpoint', new Date().toISOString())
    console.log(\`ETL complete: \${transformed.length} records\`)
  } catch (err) {
    console.error('ETL failed — full re-run required:', err)
    // No retry per stage. No dead-letter. No visibility.
    // If cron overlaps — duplicate runs, race condition on checkpoint
  }
})

// Need: Redis + cron process + separate worker machines
// No per-stage observability, no partial recovery, no backfill`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Staged pipeline, events for flow, state for recovery
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Extract — reads last checkpoint, hands off to transform
iii.registerFunction(
  { id: 'etl::extract' },
  async ({ pipeline }) => {
    const logger = new Logger()
    const checkpoint = await iii.trigger('state::get', {
      scope: pipeline, key: 'checkpoint'
    })
    const users = await db.users.find({
      updated_at: { $gt: checkpoint || new Date(0) }
    })
    logger.info('Extracted', { count: users.length })
    iii.triggerVoid('etl::transform', { pipeline, users })
    return { extracted: users.length }
  }
)

// Transform — pure function, isolated failure, no re-extract on error
iii.registerFunction(
  { id: 'etl::transform' },
  async ({ pipeline, users }) => {
    const transformed = users.map(user => ({
      user_id: user.id,
      lifetime_value: calculateLTV(user),
      segment: classifySegment(user),
    }))
    iii.triggerVoid('etl::load', { pipeline, data: transformed })
    return { transformed: transformed.length }
  }
)

// Load — saves checkpoint only after successful write
iii.registerFunction(
  { id: 'etl::load' },
  async ({ pipeline, data }) => {
    const logger = new Logger()
    await warehouse.bulkInsert('user_analytics', data)
    await iii.trigger('state::set', {
      scope: pipeline, key: 'checkpoint', value: new Date().toISOString()
    })
    logger.info('Pipeline complete', { loaded: data.length })
    return { loaded: data.length }
  }
)

// Distributed locking built in — no duplicate runs
iii.registerTrigger({
  type: 'cron',
  function_id: 'etl::extract',
  config: { expression: '0 2 * * *' }
})`,
    },
    linesTraditional: 42,
    linesIII: 48,
  },

  reactive: {
    description:
      "Real-time reactive backend without WebSocket servers or Redis wiring. Publish once, all subscribers update.",
    traditional: {
      title: "WebSocket + Redis + Postgres",
      tools: ["ws", "Socket.io", "Redis Pub/Sub", "Ably", "Supabase Realtime"],
      language: "typescript",
      code: `// Building reactive from scratch
import { WebSocketServer } from 'ws'
import Redis from 'ioredis'
import { Pool } from 'pg'

const wss = new WebSocketServer({ port: 8080 })
const pub = new Redis(process.env.REDIS_URL)
const sub = new Redis(process.env.REDIS_URL)
const pg = new Pool({ connectionString: process.env.DATABASE_URL })

// Track subscriptions per server pod — not shared across pods
const channelSubs = new Map<string, Set<WebSocket>>()

// Sync events across pods via Redis pub/sub
sub.subscribe('messages')
sub.on('message', (_, payload) => {
  const { channelId, data } = JSON.parse(payload)
  channelSubs.get(channelId)?.forEach(ws => {
    if (ws.readyState === 1) ws.send(JSON.stringify(data))
  })
})

wss.on('connection', (ws, req) => {
  const channelId = new URL(req.url!, 'ws://x').searchParams.get('channel')!
  if (!channelSubs.has(channelId)) channelSubs.set(channelId, new Set())
  channelSubs.get(channelId)!.add(ws)

  // Send initial state from Postgres on connect
  pg.query(
    'SELECT * FROM messages WHERE channel_id=$1 ORDER BY created_at DESC LIMIT 50',
    [channelId]
  ).then(({ rows }) => ws.send(JSON.stringify({ type: 'init', data: rows })))

  ws.on('close', () => channelSubs.get(channelId)?.delete(ws))
})

// Separate HTTP endpoint to send messages
app.post('/messages', async (req, res) => {
  const { channelId, content } = req.body
  const { rows: [msg] } = await pg.query(
    'INSERT INTO messages (channel_id, content) VALUES ($1, $2) RETURNING *',
    [channelId, content]
  )
  // Broadcast to all pods via Redis
  await pub.publish('messages', JSON.stringify({ channelId, data: msg }))
  res.json(msg)
})

// Need: WebSocket server + Express + Redis + Postgres — all managed manually
// Manual: connection tracking, cross-pod sync, initial state, cleanup`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Reactive backend, your database, your infrastructure
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Send message — persist to your DB, notify all subscribers instantly
iii.registerFunction(
  { id: 'chat::sendMessage' },
  async ({ channelId, content }) => {
    const logger = new Logger()

    // Use YOUR database — Postgres, Mongo, anything
    const message = await db.messages.create({
      channelId, content, createdAt: new Date()
    })

    // One call — all channel subscribers notified automatically
    iii.triggerVoid('publish', {
      topic: \`channel.\${channelId}\`,
      data: message
    })

    logger.info('Message sent', { channelId, messageId: message.id })
    return message
  }
)
iii.registerTrigger({
  type: 'http',
  function_id: 'chat::sendMessage',
  config: { api_path: 'messages', http_method: 'POST' }
})

// Get messages — initial state for connecting clients
iii.registerFunction(
  { id: 'chat::getMessages' },
  async ({ channelId }) => {
    return await db.messages.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  }
)
iii.registerTrigger({
  type: 'http',
  function_id: 'chat::getMessages',
  config: { api_path: 'channels/:channelId/messages', http_method: 'GET' }
})

// React to new messages — server-side fan-out
iii.registerFunction(
  { id: 'chat::onMessage' },
  async (message) => {
    const logger = new Logger()
    logger.info('Broadcasting', { channelId: message.channelId })
  }
)
iii.registerTrigger({
  type: 'subscribe',
  function_id: 'chat::onMessage',
  config: { topic: 'channel.general' }
})

// No WebSocket server. No Redis. Your database. Real-time built in.`,
    },
    linesTraditional: 48,
    linesIII: 50,
  },

  remote: {
    description:
      "Route requests to external services — Lambda, Stripe, Cloud Functions — without glue code. iii as the universal router.",
    traditional: {
      title: "Express + axios + Manual Retries",
      tools: ["Express.js", "axios", "AWS SDK", "Stripe SDK", "p-retry"],
      language: "typescript",
      code: `// Express gateway to external services
import express from 'express'
import axios from 'axios'
import Stripe from 'stripe'
import { Lambda } from '@aws-sdk/client-lambda'

const app = express()
const stripe = new Stripe(process.env.STRIPE_KEY!)
const lambda = new Lambda({ region: 'us-east-1' })

// Manual retry logic
async function withRetry(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}

// Route to Stripe
app.post('/api/payments', async (req, res) => {
  try {
    const session = await withRetry(() =>
      stripe.checkout.sessions.create({
        line_items: req.body.items,
        mode: 'payment',
        success_url: req.body.successUrl,
      })
    )
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Route to Lambda
app.post('/api/process', async (req, res) => {
  try {
    const result = await withRetry(() =>
      lambda.invoke({
        FunctionName: 'data-processor',
        Payload: JSON.stringify(req.body),
      })
    )
    res.json(JSON.parse(result.Payload as string))
  } catch (err) {
    res.status(502).json({ error: 'Upstream failed' })
  }
})

// Route to Google Cloud Function
app.post('/api/analyze', async (req, res) => {
  try {
    const { data } = await withRetry(() =>
      axios.post(process.env.GCF_URL!, req.body, {
        timeout: 30000,
        headers: { Authorization: \`Bearer \${process.env.GCF_TOKEN}\` },
      })
    )
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: 'Upstream failed' })
  }
})

// Each external service: separate SDK, separate error handling
// No unified observability, no automatic retries across all
app.listen(3000)`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Functions as universal remote invokers
import { init, Logger } from "iii-sdk"

const iii = init(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134')

// Route to Stripe
iii.registerFunction(
  { id: 'remote::stripe::checkout' },
  async ({ items, successUrl }) => {
    const logger = new Logger()
    const stripe = new Stripe(process.env.STRIPE_KEY!)

    const session = await stripe.checkout.sessions.create({
      line_items: items,
      mode: 'payment',
      success_url: successUrl,
    })

    logger.info('Stripe session created', { sessionId: session.id })
    return { url: session.url }
  }
)

// Route to AWS Lambda
iii.registerFunction(
  { id: 'remote::lambda::process' },
  async (payload) => {
    const logger = new Logger()
    const lambda = new Lambda({ region: 'us-east-1' })

    const result = await lambda.invoke({
      FunctionName: 'data-processor',
      Payload: JSON.stringify(payload),
    })

    logger.info('Lambda invoked', { status: result.StatusCode })
    return JSON.parse(result.Payload as string)
  }
)

// Route to any HTTP endpoint (Cloud Functions, webhooks)
iii.registerFunction(
  { id: 'remote::gcf::analyze' },
  async (payload) => {
    const resp = await fetch(process.env.GCF_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${process.env.GCF_TOKEN}\`,
      },
      body: JSON.stringify(payload),
    })
    return await resp.json()
  }
)

// Expose all as HTTP — one line each
iii.registerTrigger({
  type: 'http',
  function_id: 'remote::stripe::checkout',
  config: { api_path: 'payments', http_method: 'POST' }
})
iii.registerTrigger({
  type: 'http',
  function_id: 'remote::lambda::process',
  config: { api_path: 'process', http_method: 'POST' }
})
iii.registerTrigger({
  type: 'http',
  function_id: 'remote::gcf::analyze',
  config: { api_path: 'analyze', http_method: 'POST' }
})

// Retries, logging, tracing — all built into the engine
// Add more external services by registering more functions`,
    },
    linesTraditional: 62,
    linesIII: 52,
  },
};
