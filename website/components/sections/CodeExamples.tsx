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
      "Build REST APIs without framework lock-in. One codebase, any language.",
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
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Register API endpoint - works from any language
iii.registerFunction(
  { 
    id: 'users::create',
    metadata: { api_path: '/users', http_method: 'POST' }
  },
  async (input) => {
    const { logger } = getContext()
    logger.info('Creating user', { email: input.email })

    const user = await createUser(input)

    // Enqueue event - subscribers notified automatically
    iii.triggerVoid('enqueue', {
      topic: 'user.created',
      data: user
    })
    
    return { status_code: 201, body: user }
  }
)
`,
    },
    linesTraditional: 35,
    linesIII: 28,
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
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Register job handler - that's it
iii.registerFunction(
  { id: 'jobs::sendWelcomeEmail' },
  async (input) => {
    const { logger } = getContext()
    logger.info('Sending welcome email', { userId: input.userId })
    
    await sendWelcomeEmail(input.email)
    return { sent: true }
  }
)

// Register notification handler
iii.registerFunction(
  { id: 'jobs::sendNotification' },
  async ({ userId, message }) => {
    await sendNotification(userId, message)
  }
)

// Fire-and-forget invocation (async job)
iii.triggerVoid('jobs::sendWelcomeEmail', {
  userId: user.id,
  email: user.email
})

// Or await the result
const result = await iii.trigger(
  'jobs::sendWelcomeEmail',
  { userId, email }
)
`,
    },
    linesTraditional: 42,
    linesIII: 32,
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
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Register event handlers as functions
iii.registerFunction(
  { id: 'events::user::created' },
  async (user) => {
    const { logger } = getContext()
    logger.info('Syncing user to CRM', { userId: user.id })

    await syncToCRM(user)
  }
)

iii.registerFunction(
  { id: 'events::order::placed' },
  async (order) => {
    // Chain events naturally
    await updateInventory(order)
    iii.triggerVoid('events::warehouse::notify', order)
  }
)

// Register trigger to subscribe to events
iii.registerTrigger({
  type: 'queue',
  functionId: 'events::user::created',
  config: { topic: 'user.created' }
})

iii.triggerVoid('enqueue', {
  topic: 'user.created',
  data: newUser
})
`,
    },
    linesTraditional: 48,
    linesIII: 34,
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
import { init, MemoryStream } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Create typed stream
interface ChatMessage {
  id: string
  content: string
  userId: string
  timestamp: string
}

const chatStream = new MemoryStream<ChatMessage>()
iii.createStream('chat', chatStream)

// Handle join events via trigger
iii.registerFunction(
  { id: 'streams::onJoin(chat)' },
  async ({ subscription_id, group_id, context }) => {
    console.log(\`User joined room: \${group_id}\`)
    // Presence handled by StreamModule
  }
)

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
    
    // Set in stream - subscribers notified
    await chatStream.set({
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
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Use StateModule - same API everywhere
iii.registerFunction(
  { id: 'workflow::process' },
  async (input) => {
    const { logger } = getContext()

    // Get state - works across all workers
    const currentStep = await iii.trigger(
      'state::get',
      { workflow_id: input.workflowId, key: 'currentStep' }
    )
    
    logger.info('Processing step', { step: currentStep })
    
    // Update state - trace_id propagated automatically
    await iii.trigger('state::set', {
      workflow_id: input.workflowId,
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
`,
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
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Register the function
iii.registerFunction(
  { id: 'reports::daily' },
  async () => {
    const { logger } = getContext()
    logger.info('Generating daily report')

    const report = await generateDailyReport()

    // Store in state for retrieval
    await iii.trigger('state::set', {
      workflow_id: 'reports',
      key: 'daily-' + new Date().toISOString().split('T')[0],
      value: report
    })
    
    return { generated: true }
  }
)

// Register cron trigger - distributed locking built-in
iii.registerTrigger({
  type: 'cron',
  functionId: 'reports::daily',
  config: { schedule: '0 9 * * *' } // 9am daily
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
  functionId: 'maintenance::cleanup',
  config: { schedule: '*/5 * * * *' } // Every 5 min
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
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

iii.registerFunction(
  { id: 'orders::process' },
  async (input) => {
    // Context includes logger with trace_id
    const { logger } = getContext()
    
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
`,
    },
    linesTraditional: 52,
    linesIII: 38,
  },

  workflow: {
    description:
      "Orchestration without Temporal or Step Functions. State + Events = Workflows.",
    traditional: {
      title: "Temporal + Step Functions",
      tools: ["Temporal", "Cadence", "AWS Step Functions", "Inngest"],
      language: "typescript",
      code: `// Temporal workflow setup
import { proxyActivities, sleep } from '@temporalio/workflow'
import type * as activities from './activities'

const { sendEmail, chargeCard, shipOrder } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
  },
})

// Workflow definition
export async function orderWorkflow(order: Order): Promise<OrderResult> {
  // Step 1: Send confirmation
  await sendEmail({
    to: order.email,
    template: 'order-confirmation',
    data: order,
  })

  // Step 2: Charge card
  const payment = await chargeCard({
    amount: order.total,
    cardToken: order.paymentToken,
  })

  if (!payment.success) {
    throw new Error('Payment failed')
  }

  // Step 3: Wait for inventory check
  await sleep('5 seconds')

  // Step 4: Ship order
  const shipment = await shipOrder({
    orderId: order.id,
    address: order.shippingAddress,
  })

  return {
    orderId: order.id,
    paymentId: payment.id,
    trackingNumber: shipment.trackingNumber,
  }
}`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - State + Events = Workflows
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Step 1: Start order
iii.registerFunction(
  { id: 'order::start' },
  async (order) => {
    const { logger } = getContext()

    // Save workflow state
    await iii.trigger('state::set', {
      workflow_id: order.id,
      key: 'status',
      value: 'started'
    })
    
    logger.info('Order started', { orderId: order.id })
    
    // Trigger next step via event
    iii.triggerVoid('order::sendConfirmation', order)
    
    return { orderId: order.id, status: 'started' }
  }
)

// Step 2: Send confirmation
iii.registerFunction(
  { id: 'order::sendConfirmation' },
  async (order) => {
    await sendEmail({ to: order.email, template: 'confirmation' })

    // Update state and continue
    await iii.trigger('state::set', {
      workflow_id: order.id, key: 'status', value: 'confirmed'
    })

    iii.triggerVoid('order::chargeCard', order)
  }
)
`,
    },
    linesTraditional: 50,
    linesIII: 42,
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

const stream = await executor.streamEvents(
  { input: userMessage },
  { version: 'v1' }
)`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Functions ARE tools, State IS memory
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Register tools as functions - automatic discovery
iii.registerFunction(
  { 
    id: 'tools::searchDatabase',
    description: 'Search the product database',
    request_format: { query: 'string' }
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
    const { logger } = getContext()

    // Get conversation history from StateModule
    const history = await iii.trigger('state::get', {
      workflow_id: sessionId, key: 'history'
    }) || []
    
    // Call LLM with tools available via ListFunctions
    const response = await callLLM(message, history)
    
    // If tool call, invoke function directly
    if (response.toolCall) {
      const result = await iii.trigger(
        response.toolCall.function,
        response.toolCall.args
      )
      // Stream response back
      iii.triggerVoid('streams::send', {
        stream: 'chat', group: sessionId, data: result
      })
    }
    
    // Save to memory
    await iii.trigger('state::set', {
      workflow_id: sessionId,
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
})`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - State + Streams = Feature Flags
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Define flags in StateModule
iii.registerFunction(
  { id: 'flags::set' },
  async ({ flagKey, config }) => {
    const { logger } = getContext()

    // Store flag config
    await iii.trigger('state::set', {
      workflow_id: 'flags',
      key: flagKey,
      value: config
    })
    
    // Broadcast to all connected clients instantly
    iii.triggerVoid('streams::broadcast', {
      stream: 'flags',
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
      workflow_id: 'flags', key: flagKey
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
`,
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
import { init, MemoryStream } from "iii-sdk"

const iii = init("ws://localhost:49134")

interface Player { x: number; y: number; score: number }
const gameStream = new MemoryStream<Player>()
iii.createStream('game', gameStream)

// Player joins - StreamModule handles connections
iii.registerFunction(
  { id: 'streams::onJoin(game)' },
  async ({ subscription_id, group_id }) => {
    // group_id = room ID
    await gameStream.set({
      stream_name: 'game',
      group_id,
      item_id: subscription_id,
      data: { x: 0, y: 0, score: 0 }
    })
    
    // Broadcast to room - automatic via StreamModule
    return { joined: true }
  }
)

// Handle player movement
iii.registerFunction(
  { id: 'game::move' },
  async ({ roomId, playerId, x, y }) => {
    const player = await gameStream.get({
      stream_name: 'game', group_id: roomId, item_id: playerId
    })
    
    // Update position - broadcasts to all in room
    await gameStream.set({
      stream_name: 'game',
      group_id: roomId,
      item_id: playerId,
      data: { ...player, x, y }
    })
  }
)

// Handle game action
iii.registerFunction(
  { id: 'game::action' },
  async ({ roomId, playerId, points }) => {
    const player = await gameStream.get({
      stream_name: 'game', group_id: roomId, item_id: playerId
    })
    
    // Update score - persisted in StateModule
    await gameStream.set({
      stream_name: 'game',
      group_id: roomId,
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
      "Build ETL pipelines without Airflow or Dagster. Events for data flow, State for checkpoints.",
    traditional: {
      title: "Airflow + Celery + Redis",
      tools: ["Airflow", "Dagster", "Prefect", "Luigi", "dbt"],
      language: "python",
      code: `# Airflow DAG setup
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
from celery import Celery
import redis

redis_client = redis.Redis()
celery_app = Celery('etl', broker='redis://localhost:6379')

default_args = {
    'owner': 'data-team',
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'user_analytics_pipeline',
    default_args=default_args,
    schedule_interval='0 2 * * *',
    start_date=days_ago(1),
)

def extract_users(**context):
    checkpoint = redis_client.get('etl:users:checkpoint')
    users = db.users.find({'updated_at': {'$gt': checkpoint}})
    
    # Store in XCom for next task
    context['ti'].xcom_push(key='users', value=list(users))
    redis_client.set('etl:users:checkpoint', datetime.now().isoformat())

def transform_users(**context):
    users = context['ti'].xcom_pull(key='users', task_ids='extract')
    
    transformed = []
    for user in users:
        transformed.append({
            'user_id': user['_id'],
            'lifetime_value': calculate_ltv(user),
            'segment': classify_segment(user),
        })
    
    context['ti'].xcom_push(key='transformed', value=transformed)

def load_to_warehouse(**context):
    data = context['ti'].xcom_pull(
        key='transformed', task_ids='transform'
    )
    warehouse.bulk_insert('user_analytics', data)

extract = PythonOperator(
    task_id='extract',
    python_callable=extract_users,
    dag=dag
)
transform = PythonOperator(
    task_id='transform',
    python_callable=transform_users,
    dag=dag
)
load = PythonOperator(
    task_id='load',
    python_callable=load_to_warehouse,
    dag=dag
)

extract >> transform >> load`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Events for flow, State for checkpoints
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Step 1: Extract
iii.registerFunction(
  { id: 'etl::extract' },
  async ({ pipeline }) => {
    const { logger } = getContext()

    // Get checkpoint from StateModule
    const checkpoint = await iii.trigger('state::get', {
      workflow_id: pipeline, key: 'checkpoint'
    })
    
    const users = await db.users.find({
      updated_at: { $gt: checkpoint || new Date(0) }
    })
    
    logger.info('Extracted users', { count: users.length })
    
    // Trigger transform step
    iii.triggerVoid('etl::transform', { pipeline, users })
    
    return { extracted: users.length }
  }
)

// Step 2: Transform
iii.registerFunction(
  { id: 'etl::transform' },
  async ({ pipeline, users }) => {
    const transformed = users.map(user => ({
      user_id: user.id,
      lifetime_value: calculateLTV(user),
      segment: classifySegment(user),
    }))
    
    // Trigger load step
    iii.triggerVoid('etl::load', {
      pipeline,
      data: transformed
    })
    
    return { transformed: transformed.length }
  }
)

// Step 3: Load
iii.registerFunction(
  { id: 'etl::load' },
  async ({ pipeline, data }) => {
    const { logger } = getContext()

    await warehouse.bulkInsert('user_analytics', data)

    // Update checkpoint
    await iii.trigger('state::set', {
      workflow_id: pipeline,
      key: 'checkpoint',
      value: new Date().toISOString()
    })
    
    logger.info('Pipeline complete', { loaded: data.length })
    return { loaded: data.length }
  }
)

// Schedule with CronModule
iii.registerTrigger({
  type: 'cron',
  functionId: 'etl::extract',
  config: { schedule: '0 2 * * *' } // Daily at 2 AM
})
`,
    },
    linesTraditional: 58,
    linesIII: 65,
  },

  reactive: {
    description:
      "Build reactive backends without Convex lock-in. Real-time subscriptions + state that just works.",
    traditional: {
      title: "Convex",
      tools: ["Convex", "Firebase", "Supabase Realtime"],
      language: "typescript",
      code: `import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  handler: async (ctx, { channelId, content }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error("Not authenticated")
    
    const messageId = await ctx.db.insert("messages", {
      channelId,
      content,
      authorId: user.subject,
      createdAt: Date.now(),
    })
    
    return messageId
  },
})

export const getMessages = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", q => q.eq("channelId", channelId))
      .order("desc")
      .take(50)
  },
})

// Client subscribes reactively
// useQuery(api.messages.getMessages, { channelId })`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Reactive backend, your infrastructure
import { init, getContext } from "iii-sdk"

const iii = init("ws://localhost:49134")

// Send message - triggers reactive update
iii.registerFunction(
  {
    id: 'chat::sendMessage',
    metadata: { api_path: '/messages', http_method: 'POST' }
  },
  async ({ channelId, content }) => {
    const { logger, user } = getContext()
    
    // Use YOUR database (Postgres, Mongo, whatever)
    const message = await db.messages.create({
      channelId,
      content,
      authorId: user.id,
      createdAt: new Date()
    })
    
    // Emit to reactive subscribers
    iii.triggerVoid('realtime::publish', {
      channel: \`messages:\${channelId}\`,
      event: 'message.created',
      data: message
    })
    
    logger.info('Message sent', { channelId, messageId: message.id })
    return message
  }
)

// Query messages - clients can subscribe
iii.registerFunction(
  {
    id: 'chat::getMessages',
    metadata: { 
      api_path: '/channels/:channelId/messages',
      http_method: 'GET',
      subscribable: true  // Enable reactive subscriptions
    }
  },
  async ({ channelId }) => {
    // Query YOUR database
    const messages = await db.messages.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return messages
  }
)
`,
    },
    linesTraditional: 45,
    linesIII: 55,
  },
};
