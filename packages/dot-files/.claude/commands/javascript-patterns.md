# JavaScript Patterns for Motia

Build applications using JavaScript (without TypeScript) in Motia, perfect for rapid prototyping and simpler projects.

## Basic JavaScript API

### Simple REST Endpoint
```javascript
// steps/api/hello.step.js
const { z } = require('zod')

exports.config = {
  type: 'api',
  name: 'HelloWorld',
  method: 'GET',
  path: '/hello',
  responseSchema: {
    200: z.object({
      message: z.string(),
      timestamp: z.string()
    })
  }
}

exports.handler = async (req, { logger }) => {
  logger.info('Hello endpoint called')
  
  return {
    status: 200,
    body: {
      message: 'Hello from Motia!',
      timestamp: new Date().toISOString()
    }
  }
}
```

### CRUD Operations
```javascript
// steps/api/todos/create-todo.step.js
const { z } = require('zod')

const TodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
})

exports.config = {
  type: 'api',
  name: 'CreateTodo',
  method: 'POST',
  path: '/todos',
  bodySchema: TodoSchema,
  middleware: ['authMiddleware'],
  responseSchema: {
    201: TodoSchema.extend({
      id: z.string(),
      createdAt: z.string()
    }),
    400: z.object({ error: z.string() })
  },
  emits: ['todo.created']
}

exports.handler = async (req, { emit, state, logger }) => {
  const { title, description, completed, priority } = req.body
  const userId = req.user.userId
  
  try {
    const todoId = crypto.randomUUID()
    const todo = {
      id: todoId,
      userId,
      title,
      description: description || '',
      completed,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Store todo
    await state.set('todos', todoId, todo)
    
    // Add to user's todo list
    const userTodos = await state.get('user_todos', userId) || []
    userTodos.push(todoId)
    await state.set('user_todos', userId, userTodos)
    
    // Emit event
    await emit({
      topic: 'todo.created',
      data: { todoId, userId, title, priority }
    })
    
    logger.info('Todo created', { todoId, userId })
    
    return {
      status: 201,
      body: todo
    }
  } catch (error) {
    logger.error('Failed to create todo', { error: error.message })
    return {
      status: 500,
      body: { error: 'Failed to create todo' }
    }
  }
}
```

## Event Processing
```javascript
// steps/events/process-todo.step.js
exports.config = {
  type: 'event',
  name: 'ProcessTodo',
  subscribes: ['todo.created'],
  emits: ['notification.send', 'analytics.track'],
  input: {
    type: 'object',
    properties: {
      todoId: { type: 'string' },
      userId: { type: 'string' },
      title: { type: 'string' },
      priority: { type: 'string' }
    }
  }
}

exports.handler = async (input, { emit, state, logger }) => {
  const { todoId, userId, title, priority } = input
  
  try {
    // Get user preferences
    const user = await state.get('users', userId)
    
    // Send notification if high priority
    if (priority === 'high' && user.notificationsEnabled) {
      await emit({
        topic: 'notification.send',
        data: {
          userId,
          type: 'push',
          title: 'High Priority Todo',
          body: `Don't forget: ${title}`,
          data: { todoId }
        }
      })
    }
    
    // Track analytics
    await emit({
      topic: 'analytics.track',
      data: {
        event: 'todo_created',
        userId,
        properties: {
          priority,
          hasDescription: !!input.description,
          dayOfWeek: new Date().getDay()
        }
      }
    })
    
    // Check for daily todo limit
    const todayKey = `daily_todos:${userId}:${new Date().toISOString().split('T')[0]}`
    const dailyCount = await state.get('counters', todayKey) || 0
    
    if (dailyCount >= 50) {
      await emit({
        topic: 'notification.send',
        data: {
          userId,
          type: 'email',
          subject: 'Daily Todo Limit Reached',
          body: 'You\'ve created 50 todos today. Consider organizing or completing existing ones!'
        }
      })
    }
    
    await state.set('counters', todayKey, dailyCount + 1, 86400) // 24h TTL
    
    logger.info('Todo processed', { todoId, priority })
    
  } catch (error) {
    logger.error('Todo processing failed', { error: error.message, todoId })
    throw error
  }
}
```

## Scheduled Jobs
```javascript
// steps/cron/daily-summary.step.js
exports.config = {
  type: 'cron',
  name: 'DailySummary',
  cron: '0 9 * * *', // 9 AM every day
  timezone: 'America/New_York',
  emits: ['email.daily_summary.send'],
  flows: ['notifications']
}

exports.handler = async (input, { emit, state, logger }) => {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateKey = yesterday.toISOString().split('T')[0]
    
    // Get all active users
    const users = await state.getGroup('active_users') || []
    
    let totalSummariesSent = 0
    
    for (const userId of users) {
      try {
        // Get user's todos from yesterday
        const userTodos = await state.get('user_todos', userId) || []
        const todos = []
        
        for (const todoId of userTodos) {
          const todo = await state.get('todos', todoId)
          if (todo && todo.createdAt.startsWith(dateKey)) {
            todos.push(todo)
          }
        }
        
        if (todos.length > 0) {
          // Calculate stats
          const stats = {
            total: todos.length,
            completed: todos.filter(t => t.completed).length,
            high: todos.filter(t => t.priority === 'high').length,
            medium: todos.filter(t => t.priority === 'medium').length,
            low: todos.filter(t => t.priority === 'low').length
          }
          
          // Get user info
          const user = await state.get('users', userId)
          
          // Send summary email
          await emit({
            topic: 'email.daily_summary.send',
            data: {
              to: user.email,
              subject: `Your Daily Summary - ${stats.completed}/${stats.total} completed`,
              stats,
              todos: todos.slice(0, 10), // First 10 todos
              date: dateKey
            }
          })
          
          totalSummariesSent++
        }
      } catch (userError) {
        logger.error('Failed to process user summary', { 
          userId, 
          error: userError.message 
        })
      }
    }
    
    logger.info('Daily summary job completed', { 
      totalSummariesSent,
      date: dateKey 
    })
    
  } catch (error) {
    logger.error('Daily summary job failed', { error: error.message })
    throw error
  }
}
```

## Middleware Patterns
```javascript
// steps/middleware/auth.js
const jwt = require('jsonwebtoken')

exports.authMiddleware = async (req, ctx, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return {
      status: 401,
      body: { error: 'No token provided' }
    }
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    
    // Check if user is active
    const user = await ctx.state.get('users', decoded.userId)
    if (!user || user.status !== 'active') {
      return {
        status: 403,
        body: { error: 'User account inactive' }
      }
    }
    
    return next()
  } catch (error) {
    return {
      status: 401,
      body: { error: 'Invalid token' }
    }
  }
}

// steps/middleware/rate-limit.js
exports.rateLimitMiddleware = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000 // 15 minutes
  const max = options.max || 100
  
  return async (req, ctx, next) => {
    const key = options.keyGenerator 
      ? options.keyGenerator(req) 
      : req.ip
    
    const rateLimitKey = `rate:${key}`
    const now = Date.now()
    
    // Get current window data
    let windowData = await ctx.state.get('rate_limits', rateLimitKey) || {
      count: 0,
      resetTime: now + windowMs
    }
    
    // Reset if window expired
    if (now > windowData.resetTime) {
      windowData = {
        count: 0,
        resetTime: now + windowMs
      }
    }
    
    // Check limit
    if (windowData.count >= max) {
      return {
        status: 429,
        headers: {
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(windowData.resetTime).toISOString()
        },
        body: { error: 'Too many requests' }
      }
    }
    
    // Increment and save
    windowData.count++
    await ctx.state.set('rate_limits', rateLimitKey, windowData, Math.ceil(windowMs / 1000))
    
    // Add headers to response
    const response = await next()
    return {
      ...response,
      headers: {
        ...response.headers,
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': (max - windowData.count).toString(),
        'X-RateLimit-Reset': new Date(windowData.resetTime).toISOString()
      }
    }
  }
}
```

## Stream Processing
```javascript
// steps/api/stream/subscribe.step.js
exports.config = {
  type: 'api',
  name: 'StreamSubscribe',
  method: 'GET',
  path: '/stream/:channel',
  middleware: ['authMiddleware']
}

exports.handler = async (req, res, { streams, state }) => {
  const { channel } = req.pathParams
  const userId = req.user.userId
  
  // Check permissions
  const canAccess = await checkChannelAccess(channel, userId, state)
  if (!canAccess) {
    return { status: 403, body: { error: 'Access denied' } }
  }
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  
  // Send initial connection
  res.write(`data: ${JSON.stringify({ type: 'connected', channel })}\n\n`)
  
  // Subscribe to stream
  const stream = streams[channel]
  const unsubscribe = stream.subscribe((data) => {
    res.write(`event: ${data.event || 'message'}\n`)
    res.write(`data: ${JSON.stringify(data)}\n`)
    res.write(`id: ${Date.now()}\n\n`)
  })
  
  // Keep connection alive
  const pingInterval = setInterval(() => {
    res.write(':ping\n\n')
  }, 30000)
  
  // Cleanup on disconnect
  req.on('close', () => {
    unsubscribe()
    clearInterval(pingInterval)
    res.end()
  })
}

async function checkChannelAccess(channel, userId, state) {
  // Public channels
  if (channel.startsWith('public:')) return true
  
  // User's own channel
  if (channel === `user:${userId}`) return true
  
  // Check specific permissions
  const permissions = await state.get('channel_permissions', channel) || {}
  return permissions[userId] === true
}
```

## Utility Functions
```javascript
// steps/utils/helpers.js

// Retry with exponential backoff
exports.retryWithBackoff = async (fn, options = {}) => {
  const maxAttempts = options.maxAttempts || 3
  const baseDelay = options.baseDelay || 1000
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) throw error
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Batch operations
exports.batchProcess = async (items, processor, options = {}) => {
  const batchSize = options.batchSize || 10
  const results = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(item => processor(item).catch(err => ({ error: err.message, item })))
    )
    results.push(...batchResults)
  }
  
  return results
}

// Cache wrapper
exports.withCache = (fn, options = {}) => {
  const cache = new Map()
  const ttl = options.ttl || 60000 // 1 minute default
  
  return async (...args) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value
    }
    
    const value = await fn(...args)
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    })
    
    return value
  }
}
```

## Integration Examples

### Third-party API Integration
```javascript
// steps/integrations/weather.step.js
const axios = require('axios')

exports.config = {
  type: 'api',
  name: 'GetWeather',
  method: 'GET',
  path: '/weather/:city',
  pathParams: {
    type: 'object',
    properties: {
      city: { type: 'string' }
    }
  }
}

exports.handler = async (req, { state, logger }) => {
  const { city } = req.pathParams
  const cacheKey = `weather:${city.toLowerCase()}`
  
  try {
    // Check cache
    const cached = await state.get('cache', cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return { status: 200, body: cached.data }
    }
    
    // Fetch from API
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: city,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric'
        }
      }
    )
    
    const weatherData = {
      city: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      timestamp: new Date().toISOString()
    }
    
    // Cache for 10 minutes
    await state.set('cache', cacheKey, {
      data: weatherData,
      expiresAt: Date.now() + 600000
    }, 600)
    
    return { status: 200, body: weatherData }
    
  } catch (error) {
    logger.error('Weather API error', { error: error.message, city })
    
    if (error.response?.status === 404) {
      return { status: 404, body: { error: 'City not found' } }
    }
    
    return { status: 500, body: { error: 'Failed to fetch weather data' } }
  }
}
```

### File Processing
```javascript
// steps/api/files/process.step.js
const multer = require('multer')
const csv = require('csv-parse')
const { Readable } = require('stream')

exports.config = {
  type: 'api',
  name: 'ProcessCSV',
  method: 'POST',
  path: '/files/csv/process',
  middleware: ['authMiddleware', multer().single('file')],
  emits: ['csv.processing.started', 'csv.row.processed']
}

exports.handler = async (req, { emit, state, logger }) => {
  const file = req.file
  const processingId = crypto.randomUUID()
  
  if (!file || file.mimetype !== 'text/csv') {
    return { status: 400, body: { error: 'Please upload a CSV file' } }
  }
  
  try {
    // Create processing job
    await state.set('csv_jobs', processingId, {
      id: processingId,
      filename: file.originalname,
      status: 'processing',
      totalRows: 0,
      processedRows: 0,
      errors: [],
      startedAt: new Date().toISOString()
    })
    
    // Emit start event
    await emit({
      topic: 'csv.processing.started',
      data: { processingId, filename: file.originalname }
    })
    
    // Process CSV in background
    processCSVAsync(file.buffer, processingId, { emit, state, logger })
    
    return {
      status: 202,
      body: {
        processingId,
        message: 'CSV processing started',
        statusUrl: `/files/csv/status/${processingId}`
      }
    }
    
  } catch (error) {
    logger.error('CSV processing failed', { error: error.message })
    return { status: 500, body: { error: 'Failed to process CSV' } }
  }
}

async function processCSVAsync(buffer, processingId, ctx) {
  const { emit, state, logger } = ctx
  
  return new Promise((resolve, reject) => {
    const results = []
    let rowCount = 0
    
    Readable.from(buffer)
      .pipe(csv.parse({ columns: true }))
      .on('data', async (row) => {
        rowCount++
        
        try {
          // Process each row
          const processedRow = await processRow(row)
          results.push(processedRow)
          
          // Emit progress
          if (rowCount % 100 === 0) {
            await emit({
              topic: 'csv.row.processed',
              data: { processingId, rowsProcessed: rowCount }
            })
          }
        } catch (error) {
          logger.error('Row processing failed', { row, error: error.message })
        }
      })
      .on('end', async () => {
        // Update job status
        await state.set('csv_jobs', processingId, {
          status: 'completed',
          totalRows: rowCount,
          processedRows: results.length,
          completedAt: new Date().toISOString()
        })
        
        // Store results
        await state.set('csv_results', processingId, results)
        
        logger.info('CSV processing completed', { processingId, rowCount })
        resolve(results)
      })
      .on('error', reject)
  })
}
```