import React, { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

// Categories showing what III Engine replaces and enables
const categories = [
  // Infrastructure it replaces
  { id: "api", label: "API Frameworks" },
  { id: "jobs", label: "Background Jobs" },
  { id: "events", label: "Message Queues" },
  { id: "realtime", label: "Real-time" },
  { id: "state", label: "State & Cache" },
  { id: "cron", label: "Scheduled Tasks" },
  { id: "logging", label: "Observability" },
  { id: "workflow", label: "Workflows" },
  // Platforms it enables
  { id: "ai-agents", label: "AI Agents" },
  { id: "feature-flags", label: "Feature Flags" },
  { id: "multiplayer", label: "Multiplayer Games" },
  { id: "etl", label: "ETL Pipelines" },
  { id: "reactive", label: "Reactive Backend" },
];

interface CodeExample {
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

const codeExamples: Record<string, CodeExample> = {
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
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Register API endpoint - works from any language
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
// One unified protocol, any language`,
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

// Register notification handler
bridge.registerFunction(
  { function_path: 'jobs.sendNotification' },
  async ({ userId, message }) => {
    await sendNotification(userId, message)
  }
)

// Fire-and-forget invocation (async job)
bridge.invokeFunctionAsync('jobs.sendWelcomeEmail', {
  userId: user.id,
  email: user.email
})

// Or await the result
const result = await bridge.invokeFunction(
  'jobs.sendWelcomeEmail',
  { userId, email }
)

// Python workers use the same pattern
// Retry, visibility timeout - configured in EventModule`,
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

bridge.registerFunction(
  { function_path: 'events.order.placed' },
  async (order) => {
    // Chain events naturally
    await updateInventory(order)
    bridge.invokeFunctionAsync('events.warehouse.notify', order)
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

// EventModule handles Redis adapter, retries, DLQ`,
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
import { Bridge, MemoryStream } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Create typed stream
interface ChatMessage {
  id: string
  content: string
  userId: string
  timestamp: string
}

const chatStream = new MemoryStream<ChatMessage>()
bridge.createStream('chat', chatStream)

// Stream operations registered automatically:
// streams.get(chat), streams.set(chat), 
// streams.delete(chat), streams.getGroup(chat)

// Handle join events via trigger
bridge.registerFunction(
  { function_path: 'streams.onJoin(chat)' },
  async ({ subscription_id, group_id, context }) => {
    console.log(\`User joined room: \${group_id}\`)
    // Presence handled by StreamModule
  }
)

// Send message - broadcasts to all subscribers
bridge.registerFunction(
  { function_path: 'chat.sendMessage' },
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
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Use StateModule - same API everywhere
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
    
    // Continue workflow
    if (currentStep < 5) {
      bridge.invokeFunctionAsync('workflow.process', {
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
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Register the function
bridge.registerFunction(
  { function_path: 'reports.daily' },
  async () => {
    const { logger } = getContext()
    logger.info('Generating daily report')
    
    const report = await generateDailyReport()
    
    // Store in state for retrieval
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
  config: { schedule: '0 9 * * *' } // 9am daily
})

// Cleanup job - CronModule handles locking
bridge.registerFunction(
  { function_path: 'maintenance.cleanup' },
  async () => {
    await cleanupExpiredSessions()
  }
)

bridge.registerTrigger({
  trigger_type: 'cron',
  function_path: 'maintenance.cleanup',
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
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

bridge.registerFunction(
  { function_path: 'orders.process' },
  async (input) => {
    // Context includes logger with trace_id
    const { logger } = getContext()
    
    // Logs include trace_id + function_path automatically
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
}

// Need separate worker process
// Need Temporal server infrastructure
// DSL to learn`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - State + Events = Workflows
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Step 1: Start order
bridge.registerFunction(
  { function_path: 'order.start' },
  async (order) => {
    const { logger } = getContext()
    
    // Save workflow state
    await bridge.invokeFunction('state.set', {
      workflow_id: order.id,
      key: 'status',
      value: 'started'
    })
    
    logger.info('Order started', { orderId: order.id })
    
    // Trigger next step via event
    bridge.invokeFunctionAsync('order.sendConfirmation', order)
    
    return { orderId: order.id, status: 'started' }
  }
)

// Step 2: Send confirmation
bridge.registerFunction(
  { function_path: 'order.sendConfirmation' },
  async (order) => {
    await sendEmail({ to: order.email, template: 'confirmation' })
    
    // Update state and continue
    await bridge.invokeFunction('state.set', {
      workflow_id: order.id, key: 'status', value: 'confirmed'
    })
    
    bridge.invokeFunctionAsync('order.chargeCard', order)
  }
)

// Steps continue... each function is durable
// State persists across restarts
// No separate infrastructure needed`,
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
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Register tools as functions - automatic discovery
bridge.registerFunction(
  { 
    function_path: 'tools.searchDatabase',
    description: 'Search the product database',
    request_format: { query: 'string' }
  },
  async ({ query }) => {
    const results = await db.products.search(query)
    return { results }
  }
)

bridge.registerFunction(
  { 
    function_path: 'tools.sendEmail',
    description: 'Send an email to user'
  },
  async ({ to, subject, body }) => {
    await sendEmail(to, subject, body)
    return { sent: true }
  }
)

// Agent orchestrator - uses StateModule for memory
bridge.registerFunction(
  { function_path: 'agent.chat' },
  async ({ sessionId, message }) => {
    const { logger } = getContext()
    
    // Get conversation history from StateModule
    const history = await bridge.invokeFunction('state.get', {
      workflow_id: sessionId, key: 'history'
    }) || []
    
    // Call LLM with tools available via ListFunctions
    const response = await callLLM(message, history)
    
    // If tool call, invoke function directly
    if (response.toolCall) {
      const result = await bridge.invokeFunction(
        response.toolCall.function,
        response.toolCall.args
      )
      // Stream response back
      bridge.invokeFunctionAsync('streams.send', {
        stream: 'chat', group: sessionId, data: result
      })
    }
    
    // Save to memory
    await bridge.invokeFunction('state.set', {
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
})

// $25k+/year for enterprise features
// Vendor lock-in for flag definitions`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - State + Streams = Feature Flags
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Define flags in StateModule
bridge.registerFunction(
  { function_path: 'flags.set' },
  async ({ flagKey, config }) => {
    const { logger } = getContext()
    
    // Store flag config
    await bridge.invokeFunction('state.set', {
      workflow_id: 'flags',
      key: flagKey,
      value: config
    })
    
    // Broadcast to all connected clients instantly
    bridge.invokeFunctionAsync('streams.broadcast', {
      stream: 'flags',
      data: { type: 'update', flag: flagKey, config }
    })
    
    logger.info('Flag updated', { flagKey })
    return { updated: true }
  }
)

// Evaluate flag
bridge.registerFunction(
  { function_path: 'flags.evaluate' },
  async ({ flagKey, user, defaultValue }) => {
    const config = await bridge.invokeFunction('state.get', {
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
import { Bridge, MemoryStream } from 'iii'

const bridge = new Bridge('ws://engine:8080')

interface Player { x: number; y: number; score: number }
const gameStream = new MemoryStream<Player>()
bridge.createStream('game', gameStream)

// Player joins - StreamModule handles connections
bridge.registerFunction(
  { function_path: 'streams.onJoin(game)' },
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
bridge.registerFunction(
  { function_path: 'game.move' },
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
bridge.registerFunction(
  { function_path: 'game.action' },
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
    bridge.invokeFunctionAsync('leaderboard.update', {
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

extract >> transform >> load

# Need Airflow scheduler + webserver + database
# Need Celery workers + Redis + Flower`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Events for flow, State for checkpoints
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Step 1: Extract
bridge.registerFunction(
  { function_path: 'etl.extract' },
  async ({ pipeline }) => {
    const { logger } = getContext()
    
    // Get checkpoint from StateModule
    const checkpoint = await bridge.invokeFunction('state.get', {
      workflow_id: pipeline, key: 'checkpoint'
    })
    
    const users = await db.users.find({
      updated_at: { $gt: checkpoint || new Date(0) }
    })
    
    logger.info('Extracted users', { count: users.length })
    
    // Trigger transform step
    bridge.invokeFunctionAsync('etl.transform', { pipeline, users })
    
    return { extracted: users.length }
  }
)

// Step 2: Transform
bridge.registerFunction(
  { function_path: 'etl.transform' },
  async ({ pipeline, users }) => {
    const transformed = users.map(user => ({
      user_id: user.id,
      lifetime_value: calculateLTV(user),
      segment: classifySegment(user),
    }))
    
    // Trigger load step
    bridge.invokeFunctionAsync('etl.load', {
      pipeline,
      data: transformed
    })
    
    return { transformed: transformed.length }
  }
)

// Step 3: Load
bridge.registerFunction(
  { function_path: 'etl.load' },
  async ({ pipeline, data }) => {
    const { logger } = getContext()
    
    await warehouse.bulkInsert('user_analytics', data)
    
    // Update checkpoint
    await bridge.invokeFunction('state.set', {
      workflow_id: pipeline,
      key: 'checkpoint',
      value: new Date().toISOString()
    })
    
    logger.info('Pipeline complete', { loaded: data.length })
    return { loaded: data.length }
  }
)

// Schedule with CronModule
bridge.registerTrigger({   
  type: 'cron',
  path: 'etl.extract',
  schedule: '0 2 * * *', // Daily at 2 AM
  payload: { pipeline: 'user_analytics' }
})

// No scheduler. No Redis. No workers.
// Just functions and events.`,
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
      code: `// Convex - proprietary reactive backend
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

// Locked into Convex's hosting
// Locked into Convex's database
// Locked into Convex's pricing

export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  handler: async (ctx, { channelId, content }) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error("Not authenticated")
    
    // Insert into Convex's proprietary database
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
    // Convex auto-subscribes clients
    // But you can't use your own database
    // Can't run on your infrastructure
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", q => q.eq("channelId", channelId))
      .order("desc")
      .take(50)
  },
})

// Client subscribes reactively
// useQuery(api.messages.getMessages, { channelId })
// Real-time updates work, but you're locked in`,
    },
    iii: {
      title: "iii Engine",
      language: "typescript",
      code: `// iii SDK - Reactive backend, your infrastructure
import { Bridge, getContext } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Send message - triggers reactive update
bridge.registerFunction(
  {
    function_path: 'chat.sendMessage',
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
    bridge.invokeFunctionAsync('realtime.publish', {
      channel: \`messages:\${channelId}\`,
      event: 'message.created',
      data: message
    })
    
    logger.info('Message sent', { channelId, messageId: message.id })
    return message
  }
)

// Query messages - clients can subscribe
bridge.registerFunction(
  {
    function_path: 'chat.getMessages',
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

// Client subscribes:
// bridge.subscribe('chat.getMessages', { channelId }, (messages) => {
//   setMessages(messages)
// })
//
// Real-time updates. Your database. Your infrastructure.`,
    },
    linesTraditional: 45,
    linesIII: 55,
  },
};

interface ToolBadgeProps {
  tool: string;
  isDarkMode: boolean;
}

const ToolBadge: React.FC<ToolBadgeProps> = ({ tool, isDarkMode }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors ${
        isDarkMode
          ? "bg-iii-alert/20 text-iii-alert border border-iii-alert/30"
          : "bg-red-100 text-red-700 border border-red-200"
      }`}
    >
      {tool}
    </span>
  );
};

// Helper function to count actual lines of code (excluding comments, empty lines)
function countLinesOfCode(code: string, language: string): number {
  const lines = code.split("\n");
  let count = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Handle block comments
    if (language === "python") {
      // Python uses ''' or """ for block comments/docstrings
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        if (trimmed.endsWith('"""') || trimmed.endsWith("'''")) {
          // Single-line docstring, skip it
          if (trimmed.length > 3) continue;
        }
        inBlockComment = !inBlockComment;
        continue;
      }
    } else {
      // JS/TS block comments
      if (trimmed.startsWith("/*")) {
        inBlockComment = true;
        if (trimmed.endsWith("*/")) {
          inBlockComment = false;
        }
        continue;
      }
      if (inBlockComment) {
        if (trimmed.endsWith("*/")) {
          inBlockComment = false;
        }
        continue;
      }
    }

    if (inBlockComment) continue;

    // Skip single-line comments
    if (language === "python") {
      if (trimmed.startsWith("#")) continue;
    } else {
      if (trimmed.startsWith("//")) continue;
    }

    // Skip lines that are only braces/brackets
    if (/^[\{\}\[\]\(\)]+$/.test(trimmed)) continue;

    count++;
  }

  return count;
}

function CodeBlock({
  code,
  title,
  tools,
  variant,
  isDarkMode,
  language = "typescript",
}: {
  code: string;
  title: string;
  tools?: string[];
  variant: "traditional" | "iii";
  isDarkMode: boolean;
  language?: string;
}) {
  const isTraditional = variant === "traditional";
  const lineCount = countLinesOfCode(code, language);

  return (
    <div
      className={`rounded-lg sm:rounded-xl overflow-hidden border h-full flex flex-col transition-colors duration-300 ${
        isDarkMode
          ? "border-iii-light bg-iii-black"
          : "border-iii-dark bg-white"
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b transition-colors duration-300 flex-shrink-0 ${
          isDarkMode
            ? "border-iii-light bg-iii-dark/50"
            : "border-iii-dark bg-iii-light/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isTraditional
                  ? "bg-iii-alert"
                  : isDarkMode
                  ? "bg-iii-accent"
                  : "bg-iii-accent-light"
              }`}
            />
            <span
              className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? "text-iii-light" : "text-iii-black"
              }`}
            >
              {title}
            </span>
          </div>
          <span
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded font-medium transition-colors ${
              isTraditional
                ? isDarkMode
                  ? "bg-iii-alert/20 text-iii-alert"
                  : "bg-red-100 text-red-700"
                : isDarkMode
                ? "bg-iii-accent/20 text-iii-accent"
                : "bg-iii-accent-light/20 text-iii-accent-light"
            }`}
          >
            {lineCount} lines
          </span>
        </div>
        {tools && tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tools.map((tool) => (
              <ToolBadge key={tool} tool={tool} isDarkMode={isDarkMode} />
            ))}
          </div>
        )}
      </div>

      {/* Code */}
      <div
        className={`p-2 sm:p-3 md:p-4 overflow-auto flex-1 max-h-[400px] sm:max-h-[500px] ${
          isDarkMode ? "scrollbar-brand-dark" : "scrollbar-brand-light"
        }`}
      >
        <Highlight
          theme={isDarkMode ? themes.nightOwl : themes.github}
          code={code.trim()}
          language={language as any}
        >
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="text-[9px] sm:text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto">
              {tokens.map((line, i) => (
                <div
                  key={i}
                  {...getLineProps({ line })}
                  className="whitespace-pre"
                >
                  <span
                    className={`inline-block w-6 sm:w-8 text-right mr-2 sm:mr-3 select-none ${
                      isDarkMode ? "text-iii-light/30" : "text-iii-medium/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

function SavingsIndicator({
  traditionalCode,
  iiiCode,
  traditionalLanguage,
  iiiLanguage,
  toolsCount,
  isDarkMode,
}: {
  traditionalCode: string;
  iiiCode: string;
  traditionalLanguage: string;
  iiiLanguage: string;
  toolsCount: number;
  isDarkMode: boolean;
}) {
  const traditional = countLinesOfCode(traditionalCode, traditionalLanguage);
  const iii = countLinesOfCode(iiiCode, iiiLanguage);
  const difference = traditional - iii;
  const isLess = difference > 0;
  const isSame = difference === 0;
  const percentage = Math.round((Math.abs(difference) / traditional) * 100);

  // Different colors for each state
  const codeComparisonColor = isSame
    ? "text-iii-info"
    : isLess
    ? "text-iii-success"
    : "text-iii-warn";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 py-3 sm:py-4 px-4 rounded-lg transition-colors ${
        isDarkMode ? "bg-iii-dark/30" : "bg-iii-light"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSame ? (
          // Equals icon for same
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 ${codeComparisonColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 9h14M5 15h14"
            />
          </svg>
        ) : isLess ? (
          // Downward trend icon for less code (good)
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 ${codeComparisonColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
            />
          </svg>
        ) : (
          // Upward trend icon for more code (warning)
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 ${codeComparisonColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        )}
        <span
          className={`text-xs sm:text-sm ${
            isDarkMode ? "text-[#C0C0C0]" : "text-iii-black"
          }`}
        >
          {isSame ? (
            <span className={`font-bold ${codeComparisonColor}`}>
              Same amount of code
            </span>
          ) : (
            <>
              <span className={`font-bold ${codeComparisonColor}`}>
                {percentage}%
              </span>{" "}
              {isLess ? "less" : "more"} code
            </>
          )}
        </span>
      </div>
      <div
        className={`hidden sm:block w-px h-4 ${
          isDarkMode ? "bg-[#3A3A3A]" : "bg-iii-medium/30"
        }`}
      />
      <div className="flex items-center gap-2">
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <span
          className={`text-xs sm:text-sm ${
            isDarkMode ? "text-[#C0C0C0]" : "text-iii-black"
          }`}
        >
          <span
            className={`font-bold ${
              isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
            }`}
          >
            {toolsCount}+
          </span>{" "}
          tools replaced
        </span>
      </div>
      <div
        className={`hidden sm:block w-px h-4 ${
          isDarkMode ? "bg-[#3A3A3A]" : "bg-iii-medium/30"
        }`}
      />
      <div className="flex items-center gap-2">
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
          />
        </svg>
        <span
          className={`text-xs sm:text-sm ${
            isDarkMode ? "text-[#C0C0C0]" : "text-iii-black"
          }`}
        >
          <span
            className={`font-bold ${
              isDarkMode ? "text-iii-accent" : "text-iii-accent-light"
            }`}
          >
            Any
          </span>{" "}
          language
        </span>
      </div>
    </div>
  );
}

interface ExampleCodeSectionProps {
  isDarkMode?: boolean;
}

export function ExampleCodeSection({
  isDarkMode = true,
}: ExampleCodeSectionProps) {
  const [activeCategory, setActiveCategory] = useState("api");

  const currentExample = codeExamples[activeCategory];

  return (
    <section
      className={`relative overflow-hidden font-mono transition-colors duration-300 ${
        isDarkMode ? "text-iii-light" : "text-iii-black"
      }`}
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-3 sm:mb-4 md:mb-6 space-y-2 sm:space-y-3 md:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter">
            Stop <span className="text-iii-alert">assembling</span>
            {", start "}
            <span className="text-iii-success">building</span>
          </h2>
          <p
            className={`text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto px-2 ${
              isDarkMode ? "text-iii-light/70" : "text-iii-medium"
            }`}
          >
            Services, frameworks, integrations, these all become design
            patterns.
          </p>
        </div>

        {/* Category Pills */}
        <div className="mb-2 sm:mb-3 md:mb-4">
          <div className="flex overflow-x-auto scrollbar-hide pb-2 justify-center">
            <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center px-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs md:text-sm transition-all whitespace-nowrap font-medium ${
                    activeCategory === category.id
                      ? isDarkMode
                        ? "bg-iii-accent text-iii-black"
                        : "bg-iii-accent-light text-iii-light"
                      : isDarkMode
                      ? "text-iii-light/70 hover:text-iii-light hover:bg-iii-dark/50 border border-iii-light"
                      : "text-iii-medium hover:text-iii-black hover:bg-iii-medium/10 border border-iii-dark"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {currentExample && (
          <div className="min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem] mb-3 sm:mb-4 md:mb-6 max-w-2xl mx-auto flex items-center justify-center px-2">
            <p
              className={`text-center text-[11px] sm:text-xs md:text-sm leading-5 sm:leading-6 ${
                isDarkMode ? "text-iii-light/70" : "text-iii-medium"
              }`}
            >
              {currentExample.description}
            </p>
          </div>
        )}

        {/* Code comparison */}
        {currentExample && (
          <div className="space-y-4 sm:space-y-6 lg:max-w-[90%] lg:mx-auto">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6">
              <div className="flex-1 min-w-0 lg:w-[calc(50%-0.75rem)]">
                <CodeBlock
                  code={currentExample.traditional.code}
                  title={currentExample.traditional.title}
                  tools={currentExample.traditional.tools}
                  variant="traditional"
                  isDarkMode={isDarkMode}
                  language={currentExample.traditional.language}
                />
              </div>
              <div className="flex-1 min-w-0 lg:w-[calc(50%-0.75rem)]">
                <CodeBlock
                  code={currentExample.iii.code}
                  title={currentExample.iii.title}
                  variant="iii"
                  isDarkMode={isDarkMode}
                  language={currentExample.iii.language}
                />
              </div>
            </div>

            {/* Savings indicator */}
            <SavingsIndicator
              traditionalCode={currentExample.traditional.code}
              iiiCode={currentExample.iii.code}
              traditionalLanguage={currentExample.traditional.language}
              iiiLanguage={currentExample.iii.language}
              toolsCount={currentExample.traditional.tools?.length ?? 0}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
    </section>
  );
}
