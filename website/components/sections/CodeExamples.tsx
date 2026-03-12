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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'users::create' }, async (req) => {
  const logger = new Logger()
  const user = await createUser(req.body)

  iii.triggerVoid('publish', {
    topic: 'user.created', data: user
  })

  logger.info('Created', { userId: user.id })
  return { status_code: 201, body: user }
})

iii.registerTrigger({
  type: 'http',
  function_id: 'users::create',
  config: { api_path: 'users', http_method: 'POST' }
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'jobs::welcome' }, async (input) => {
  const logger = new Logger()
  await sendWelcomeEmail(input.email)
  logger.info('Welcome email sent', { userId: input.userId })
  return { sent: true }
})

iii.registerTrigger({
  type: 'queue',
  function_id: 'jobs::welcome',
  config: {
    topic: 'emails',
    queue: { maxRetries: 3, concurrency: 5 }
  }
})

iii.triggerVoid('enqueue', {
  topic: 'emails',
  data: { userId: user.id, email: user.email }
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'events::onUserCreated' },
  async (user) => {
    const logger = new Logger()
    await syncToCRM(user)
    logger.info('Synced to CRM', { userId: user.id })
  }
)

iii.registerFunction({ id: 'events::onOrderPlaced' },
  async (order) => {
    await updateInventory(order)
    await notifyWarehouse(order)
  }
)

iii.registerTrigger({
  type: 'subscribe',
  function_id: 'events::onUserCreated',
  config: { topic: 'user.created' }
})

iii.registerTrigger({
  type: 'subscribe',
  function_id: 'events::onOrderPlaced',
  config: { topic: 'order.placed' }
})

iii.triggerVoid('publish', {
  topic: 'user.created', data: newUser
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

// Send message — set in stream, all subscribers notified
iii.registerFunction({ id: 'chat::send' }, async (input) => {
  const logger = new Logger()
  const message = {
    id: crypto.randomUUID(),
    content: input.content,
    userId: input.userId,
    timestamp: new Date().toISOString()
  }

  await iii.trigger('stream::set', {
    stream_name: 'chat',
    group_id: input.roomId,
    item_id: message.id,
    data: message
  })

  logger.info('Sent', { roomId: input.roomId })
  return message
})

// Get room history
iii.registerFunction({ id: 'chat::history' }, async (input) => {
  return await iii.trigger('stream::list', {
    stream_name: 'chat',
    group_id: input.roomId
  })
})

// React to joins
iii.registerFunction({ id: 'chat::onJoin' }, async (input) => {
  const logger = new Logger()
  logger.info('Joined', { room: input.group_id })
})
iii.registerTrigger({
  type: 'stream:join',
  function_id: 'chat::onJoin',
  config: { stream_name: 'chat' }
})

// Clients subscribe via WebSocket for real-time updates:
// ws://host:3112/stream/chat/room-1/`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'workflow::process' },
  async (input) => {
    const logger = new Logger()

    const step = await iii.trigger('state::get', {
      scope: input.workflowId, key: 'currentStep'
    })

    logger.info('Processing', { step })

    await iii.trigger('state::set', {
      scope: input.workflowId,
      key: 'currentStep',
      value: step + 1
    })

    if (step < 5) {
      iii.triggerVoid('enqueue', {
        topic: 'workflow.process',
        data: { workflowId: input.workflowId }
      })
    }

    return { step, status: 'processed' }
  }
)

iii.registerTrigger({
  type: 'queue',
  function_id: 'workflow::process',
  config: { topic: 'workflow.process' }
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'reports::daily' }, async () => {
  const logger = new Logger()
  const report = await generateDailyReport()

  await iii.trigger('state::set', {
    scope: 'reports',
    key: 'daily-' + new Date().toISOString().split('T')[0],
    value: report
  })

  logger.info('Report generated')
  return { generated: true }
})

iii.registerTrigger({
  type: 'cron',
  function_id: 'reports::daily',
  config: { expression: '0 9 * * *' }
})

iii.registerFunction({ id: 'maintenance::cleanup' },
  async () => { await cleanupExpiredSessions() }
)

iii.registerTrigger({
  type: 'cron',
  function_id: 'maintenance::cleanup',
  config: { expression: '*/5 * * * *' }
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'orders::process' },
  async (input) => {
    const logger = new Logger()

    logger.info('Processing', {
      orderId: input.orderId,
      items: input.items.length
    })

    const order = await processOrder(input)

    logger.info('Processed', {
      orderId: order.id,
      total: order.total
    })

    return order
  }
)

iii.registerTrigger({
  type: 'http',
  function_id: 'orders::process',
  config: { api_path: 'orders', http_method: 'POST' }
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

// Step 1 — HTTP starts the workflow
iii.registerFunction({ id: 'order::start' }, async (order) => {
  const logger = new Logger()
  await sendConfirmation(order)

  await iii.trigger('state::set', {
    scope: order.id, key: 'status', value: 'confirmed'
  })
  logger.info('Confirmed', { orderId: order.id })

  iii.triggerVoid('enqueue', {
    topic: 'order.charge', data: order
  })
  return { status_code: 202, body: { status: 'confirmed' } }
})
iii.registerTrigger({
  type: 'http',
  function_id: 'order::start',
  config: { api_path: 'orders', http_method: 'POST' }
})

// Step 2 — queue = at-least-once + retries
iii.registerFunction({ id: 'order::charge' }, async (order) => {
  const payment = await chargeCard(order)

  await iii.trigger('state::set', {
    scope: order.id, key: 'payment', value: payment
  })

  iii.triggerVoid('enqueue', {
    topic: 'order.ship', data: order
  })
})
iii.registerTrigger({
  type: 'queue',
  function_id: 'order::charge',
  config: { topic: 'order.charge', queue: { maxRetries: 3 } }
})

// Step 3 — also queue-triggered
iii.registerFunction({ id: 'order::ship' }, async (order) => {
  const shipment = await shipOrder(order)

  await iii.trigger('state::set', {
    scope: order.id, key: 'status', value: 'shipped'
  })
  return { tracking: shipment.trackingNumber }
})
iii.registerTrigger({
  type: 'queue',
  function_id: 'order::ship',
  config: { topic: 'order.ship', queue: { maxRetries: 3 } }
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

// Router agent — classifies intent, dispatches to specialists
iii.registerFunction({ id: 'agent::router' }, async (input) => {
  const logger = new Logger()
  const history = await iii.trigger('state::get', {
    scope: input.sessionId, key: 'history'
  }) || []

  const intent = await classifyIntent(input.message, history)
  logger.info('Routing', { intent, sessionId: input.sessionId })

  iii.triggerVoid('enqueue', {
    topic: \`agent.\${intent}\`,
    data: { ...input, history }
  })
})
iii.registerTrigger({
  type: 'http',
  function_id: 'agent::router',
  config: { api_path: 'chat', http_method: 'POST' }
})

// Support agent — handles customer queries
iii.registerFunction({ id: 'agent::support' }, async (input) => {
  const answer = await callLLM(input.message, input.history)

  await iii.trigger('state::set', {
    scope: input.sessionId, key: 'history',
    value: [...input.history, { role: 'assistant', content: answer }]
  })

  iii.triggerVoid('publish', {
    topic: 'agent.responses',
    data: { sessionId: input.sessionId, answer }
  })
})
iii.registerTrigger({
  type: 'queue',
  function_id: 'agent::support',
  config: { topic: 'agent.support', queue: { maxRetries: 2 } }
})

// Analyst agent — runs data queries, publishes results
iii.registerFunction({ id: 'agent::analyst' }, async (input) => {
  const results = await queryDatabase(input.message)

  iii.triggerVoid('publish', {
    topic: 'agent.responses',
    data: { sessionId: input.sessionId, results }
  })
})
iii.registerTrigger({
  type: 'queue',
  function_id: 'agent::analyst',
  config: { topic: 'agent.analyst', queue: { maxRetries: 2 } }
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'flags::set' },
  async ({ flagKey, config }) => {
    const logger = new Logger()

    await iii.trigger('state::set', {
      scope: 'flags', key: flagKey, value: config
    })

    iii.triggerVoid('publish', {
      topic: 'flags.updated',
      data: { flag: flagKey, config }
    })

    logger.info('Flag set', { flagKey })
    return { updated: true }
  }
)

iii.registerFunction({ id: 'flags::evaluate' },
  async ({ flagKey, user, defaultValue }) => {
    const config = await iii.trigger('state::get', {
      scope: 'flags', key: flagKey
    })

    if (!config) return defaultValue
    if (config.userIds?.includes(user.id)) return config.value
    if (config.percentage) {
      const hash = hashUser(user.id, flagKey)
      if (hash < config.percentage) return config.value
    }
    return defaultValue
  }
)`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

// Player joins — stream:join auto-fires
iii.registerFunction({ id: 'game::onJoin' }, async (input) => {
  await iii.trigger('stream::set', {
    stream_name: 'game',
    group_id: input.group_id,
    item_id: input.subscription_id,
    data: { x: 0, y: 0, score: 0 }
  })
})
iii.registerTrigger({
  type: 'stream:join',
  function_id: 'game::onJoin',
  config: { stream_name: 'game' }
})

// Handle movement — update stream, clients see it instantly
iii.registerFunction({ id: 'game::move' }, async (input) => {
  const player = await iii.trigger('stream::get', {
    stream_name: 'game',
    group_id: input.roomId,
    item_id: input.playerId
  })

  await iii.trigger('stream::set', {
    stream_name: 'game',
    group_id: input.roomId,
    item_id: input.playerId,
    data: { ...player, x: input.x, y: input.y }
  })
})

// Handle scoring — update stream + publish event
iii.registerFunction({ id: 'game::action' }, async (input) => {
  const player = await iii.trigger('stream::get', {
    stream_name: 'game',
    group_id: input.roomId,
    item_id: input.playerId
  })

  const newScore = player.score + input.points
  await iii.trigger('stream::set', {
    stream_name: 'game',
    group_id: input.roomId,
    item_id: input.playerId,
    data: { ...player, score: newScore }
  })

  iii.triggerVoid('publish', {
    topic: 'leaderboard.updated',
    data: { playerId: input.playerId, score: newScore }
  })
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'etl::extract' }, async ({ pipeline }) => {
  const logger = new Logger()
  const checkpoint = await iii.trigger('state::get', {
    scope: pipeline, key: 'checkpoint'
  })

  const users = await db.users.find({
    updated_at: { $gt: checkpoint || new Date(0) }
  })

  logger.info('Extracted', { count: users.length })
  iii.triggerVoid('enqueue', {
    topic: 'etl.transform', data: { pipeline, users }
  })
})

iii.registerFunction({ id: 'etl::transform' }, async (input) => {
  const data = input.users.map(u => ({
    user_id: u.id,
    lifetime_value: calculateLTV(u),
    segment: classifySegment(u),
  }))

  iii.triggerVoid('enqueue', {
    topic: 'etl.load', data: { pipeline: input.pipeline, data }
  })
})

iii.registerFunction({ id: 'etl::load' }, async (input) => {
  const logger = new Logger()
  await warehouse.bulkInsert('user_analytics', input.data)

  await iii.trigger('state::set', {
    scope: input.pipeline,
    key: 'checkpoint',
    value: new Date().toISOString()
  })
  logger.info('Complete', { loaded: input.data.length })
})

iii.registerTrigger({ type: 'cron', function_id: 'etl::extract',
  config: { expression: '0 2 * * *' } })
iii.registerTrigger({ type: 'queue', function_id: 'etl::transform',
  config: { topic: 'etl.transform' } })
iii.registerTrigger({ type: 'queue', function_id: 'etl::load',
  config: { topic: 'etl.load' } })`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'chat::send' }, async (input) => {
  const logger = new Logger()
  const message = await db.messages.create({
    channelId: input.channelId,
    content: input.content,
    createdAt: new Date()
  })

  iii.triggerVoid('publish', {
    topic: \`channel.\${input.channelId}\`,
    data: message
  })

  logger.info('Sent', { messageId: message.id })
  return message
})
iii.registerTrigger({
  type: 'http',
  function_id: 'chat::send',
  config: { api_path: 'messages', http_method: 'POST' }
})

iii.registerFunction({ id: 'chat::history' },
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
  function_id: 'chat::history',
  config: { api_path: 'messages/:channelId', http_method: 'GET' }
})

iii.registerFunction({ id: 'chat::onMessage' },
  async (msg) => {
    const logger = new Logger()
    logger.info('New message', { channelId: msg.channelId })
  }
)
iii.registerTrigger({
  type: 'subscribe',
  function_id: 'chat::onMessage',
  config: { topic: 'channel.general' }
})`,
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
      code: `import { registerWorker, Logger } from "iii-sdk"

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'remote::stripe' }, async (input) => {
  const logger = new Logger()
  const stripe = new Stripe(process.env.STRIPE_KEY!)

  const session = await stripe.checkout.sessions.create({
    line_items: input.items,
    mode: 'payment',
    success_url: input.successUrl,
  })

  logger.info('Checkout created', { id: session.id })
  return { url: session.url }
})

iii.registerFunction({ id: 'remote::lambda' }, async (payload) => {
  const lambda = new Lambda({ region: 'us-east-1' })
  const result = await lambda.invoke({
    FunctionName: 'data-processor',
    Payload: JSON.stringify(payload),
  })
  return JSON.parse(result.Payload as string)
})

iii.registerFunction({ id: 'remote::gcf' }, async (payload) => {
  const resp = await fetch(process.env.GCF_URL!, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
  return await resp.json()
})

iii.registerTrigger({ type: 'http', function_id: 'remote::stripe',
  config: { api_path: 'payments', http_method: 'POST' } })
iii.registerTrigger({ type: 'http', function_id: 'remote::lambda',
  config: { api_path: 'process', http_method: 'POST' } })
iii.registerTrigger({ type: 'http', function_id: 'remote::gcf',
  config: { api_path: 'analyze', http_method: 'POST' } })`,
    },
    linesTraditional: 62,
    linesIII: 52,
  },
};
