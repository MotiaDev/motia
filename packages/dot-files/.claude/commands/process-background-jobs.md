# Process Background Jobs

Handle any background processing with Motia - from sending emails to processing videos, generating reports, or running ML models.

## Quick Start - Your First Background Job

```javascript
// Step 1: Trigger the job from your API
// steps/api/upload.step.js
exports.config = {
  type: 'api',
  method: 'POST',
  path: '/upload',
  emits: ['file.uploaded']  // This triggers the background job
}

exports.handler = async (req, { emit }) => {
  const fileId = crypto.randomUUID()
  
  // Trigger background processing
  await emit({
    topic: 'file.uploaded',
    data: { fileId, filename: req.body.filename }
  })
  
  return { 
    status: 202,  // Accepted - processing in background
    body: { fileId, status: 'processing' } 
  }
}
```

```javascript
// Step 2: Process in the background
// steps/events/process-file.step.js
exports.config = {
  type: 'event',
  subscribes: ['file.uploaded'],  // Listens for the event
  emits: ['file.processed', 'notification.send']
}

exports.handler = async (input, { emit, state, logger }) => {
  const { fileId, filename } = input
  
  try {
    // Do heavy processing here
    logger.info(`Processing file: ${filename}`)
    
    // Simulate processing
    const result = await processFile(fileId)
    
    // Save result
    await state.set('processed_files', fileId, result)
    
    // Notify completion
    await emit({
      topic: 'file.processed',
      data: { fileId, result }
    })
    
  } catch (error) {
    logger.error('Processing failed', { error, fileId })
    throw error  // Will retry automatically
  }
}
```

That's it! Your job runs in the background while the API responds immediately.

## Choose Your Processing Language

### JavaScript - Quick Tasks
Best for: Simple processing, API calls, data transformation

```javascript
// steps/events/send-email.step.js
exports.config = {
  type: 'event',
  subscribes: ['user.registered'],
  emits: ['email.sent']
}

exports.handler = async (input, { emit, logger }) => {
  const { email, name } = input
  
  // Send email via API
  await sendEmail({
    to: email,
    subject: 'Welcome!',
    body: `Hi ${name}, welcome to our app!`
  })
  
  await emit({
    topic: 'email.sent',
    data: { email, type: 'welcome' }
  })
  
  logger.info('Welcome email sent', { email })
}
```

### Python - AI/ML Processing
Best for: Machine learning, data science, image/video processing

```python
# steps/ml/analyze_image_step.py
from PIL import Image
import tensorflow as tf
import io

config = {
    "type": "event",
    "subscribes": ["image.uploaded"],
    "emits": ["image.analyzed"]
}

model = tf.keras.applications.MobileNetV2()

async def handler(input_data, ctx):
    image_id = input_data["imageId"]
    
    # Get image from state
    image_data = await ctx.state.get("images", image_id)
    
    # Process with AI
    img = Image.open(io.BytesIO(image_data["buffer"]))
    predictions = model.predict(preprocess(img))
    
    results = {
        "labels": decode_predictions(predictions),
        "confidence": float(predictions.max()),
        "processedAt": datetime.now().isoformat()
    }
    
    # Save results
    await ctx.state.set("image_analysis", image_id, results)
    
    # Emit completion
    await ctx.emit({
        "topic": "image.analyzed",
        "data": {"imageId": image_id, "results": results}
    })
```

### Ruby - Data Processing & Reports
Best for: CSV processing, PDF generation, data exports

```ruby
# steps/reports/generate_report.step.rb
require 'prawn'
require 'csv'

def config
  {
    type: 'event',
    subscribes: ['report.requested'],
    emits: ['report.generated', 'email.send']
  }
end

def handler(input, context)
  report_id = input['reportId']
  user_id = input['userId']
  
  # Get data
  data = context.state.get_group("analytics:#{user_id}")
  
  # Generate PDF
  pdf_path = "/tmp/report_#{report_id}.pdf"
  
  Prawn::Document.generate(pdf_path) do |pdf|
    pdf.text "Analytics Report", size: 20, style: :bold
    pdf.move_down 20
    
    # Add charts, tables, etc
    data.each do |metric|
      pdf.text "#{metric['name']}: #{metric['value']}"
    end
  end
  
  # Upload to storage
  report_url = upload_file(pdf_path)
  
  # Emit completion
  context.emit(
    topic: 'report.generated',
    data: { reportId: report_id, url: report_url }
  )
  
  # Send email
  context.emit(
    topic: 'email.send',
    data: {
      to: input['email'],
      subject: 'Your report is ready',
      attachmentUrl: report_url
    }
  )
end
```

## Common Background Job Patterns

### 1. Fire and Forget
Simple jobs that don't need tracking

```javascript
// Trigger
await emit({ topic: 'log.event', data: { event: 'user_login' } })

// Process
exports.config = {
  type: 'event',
  subscribes: ['log.event']
}

exports.handler = async (input, { logger }) => {
  // Log to external service
  await logToDatadog(input.event)
}
```

### 2. Job with Status Updates
Track progress of long-running jobs

```javascript
// steps/events/video-processing.step.js
exports.config = {
  type: 'event',
  subscribes: ['video.uploaded'],
  emits: ['video.progress', 'video.completed']
}

exports.handler = async (input, { emit, state }) => {
  const { videoId } = input
  
  // Update status
  await state.set('jobs', videoId, { status: 'processing', progress: 0 })
  
  // Process with progress updates
  for (let i = 0; i <= 100; i += 10) {
    await processVideoChunk(videoId, i)
    
    // Update progress
    await state.set('jobs', videoId, { status: 'processing', progress: i })
    
    // Emit progress event
    await emit({
      topic: 'video.progress',
      data: { videoId, progress: i }
    })
  }
  
  // Mark complete
  await state.set('jobs', videoId, { status: 'completed', progress: 100 })
  
  await emit({
    topic: 'video.completed',
    data: { videoId }
  })
}
```

### 3. Batch Processing
Process multiple items efficiently

```javascript
// steps/events/batch-processor.step.js
exports.config = {
  type: 'event',
  subscribes: ['batch.process'],
  emits: ['batch.completed']
}

exports.handler = async (input, { emit, state, logger }) => {
  const { batchId, items } = input
  const results = []
  
  // Process in chunks
  const chunkSize = 10
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    
    // Process chunk in parallel
    const chunkResults = await Promise.all(
      chunk.map(item => processItem(item))
    )
    
    results.push(...chunkResults)
    
    // Update progress
    const progress = Math.round((i + chunk.length) / items.length * 100)
    await state.set('batches', batchId, { progress })
    
    logger.info(`Batch ${batchId}: ${progress}% complete`)
  }
  
  // Save results
  await state.set('batch_results', batchId, results)
  
  await emit({
    topic: 'batch.completed',
    data: { batchId, count: results.length }
  })
}
```

### 4. Scheduled Cleanup Jobs
Regular maintenance tasks

```javascript
// steps/cron/cleanup.step.js
exports.config = {
  type: 'cron',
  cron: '0 2 * * *',  // Run at 2 AM daily
  emits: ['cleanup.completed']
}

exports.handler = async (input, { state, logger, emit }) => {
  let cleaned = 0
  
  // Clean old sessions
  const sessions = await state.getGroup('sessions')
  for (const session of sessions) {
    if (isExpired(session)) {
      await state.delete('sessions', session.id)
      cleaned++
    }
  }
  
  // Clean old files
  const files = await state.getGroup('temp_files')
  for (const file of files) {
    if (isOlderThan(file, 7)) {  // 7 days
      await deleteFile(file.path)
      await state.delete('temp_files', file.id)
      cleaned++
    }
  }
  
  logger.info(`Cleanup completed: ${cleaned} items removed`)
  
  await emit({
    topic: 'cleanup.completed',
    data: { cleaned, timestamp: new Date() }
  })
}
```

### 5. Multi-Step Workflows
Complex processing chains

```javascript
// Step 1: Receive order
exports.config = {
  type: 'event',
  subscribes: ['order.placed'],
  emits: ['inventory.check']
}

// Step 2: Check inventory
exports.config = {
  type: 'event',
  subscribes: ['inventory.check'],
  emits: ['payment.process', 'order.cancelled']
}

// Step 3: Process payment
exports.config = {
  type: 'event',
  subscribes: ['payment.process'],
  emits: ['order.confirmed', 'payment.failed']
}

// Step 4: Send confirmation
exports.config = {
  type: 'event',
  subscribes: ['order.confirmed'],
  emits: ['email.send', 'sms.send']
}
```

## Advanced Patterns

### Retry with Backoff
Handle failures gracefully

```javascript
// steps/events/with-retry.step.js
exports.config = {
  type: 'event',
  subscribes: ['process.with.retry'],
  emits: ['process.retry', 'process.failed']
}

exports.handler = async (input, { emit, state, logger }) => {
  const { taskId, attempt = 1 } = input
  const maxAttempts = 3
  
  try {
    // Try processing
    await riskyOperation(taskId)
    
    logger.info('Processing succeeded', { taskId, attempt })
    
  } catch (error) {
    logger.error('Processing failed', { error, taskId, attempt })
    
    if (attempt < maxAttempts) {
      // Retry with exponential backoff
      const delay = Math.pow(2, attempt) * 1000  // 2s, 4s, 8s
      
      setTimeout(async () => {
        await emit({
          topic: 'process.with.retry',
          data: { ...input, attempt: attempt + 1 }
        })
      }, delay)
      
    } else {
      // Max retries reached
      await emit({
        topic: 'process.failed',
        data: { taskId, error: error.message, attempts: attempt }
      })
    }
  }
}
```

### Priority Queue
Process important jobs first

```javascript
// steps/events/priority-processor.step.js
exports.config = {
  type: 'event',
  subscribes: ['job.queued']
}

exports.handler = async (input, { state }) => {
  const { jobId, priority = 'normal' } = input
  
  // Add to priority queue
  const queueKey = `queue:${priority}`  // queue:high, queue:normal, queue:low
  const queue = await state.get('queues', queueKey) || []
  
  queue.push({ jobId, timestamp: Date.now() })
  await state.set('queues', queueKey, queue)
}

// Separate processor that reads from queues in priority order
exports.processQueues = async ({ state, emit }) => {
  const priorities = ['high', 'normal', 'low']
  
  for (const priority of priorities) {
    const queue = await state.get('queues', `queue:${priority}`) || []
    
    if (queue.length > 0) {
      const job = queue.shift()
      await state.set('queues', `queue:${priority}`, queue)
      
      await emit({
        topic: 'job.process',
        data: job
      })
      
      break  // Process one job at a time
    }
  }
}
```

### Rate Limited Processing
Respect external API limits

```javascript
// steps/events/rate-limited.step.js
const rateLimiter = {
  tokens: 100,
  refillRate: 100,  // per minute
  lastRefill: Date.now()
}

exports.handler = async (input, { state, logger }) => {
  // Refill tokens
  const now = Date.now()
  const timePassed = (now - rateLimiter.lastRefill) / 60000  // minutes
  rateLimiter.tokens = Math.min(
    100, 
    rateLimiter.tokens + (timePassed * rateLimiter.refillRate)
  )
  rateLimiter.lastRefill = now
  
  // Check if we have tokens
  if (rateLimiter.tokens < 1) {
    // Requeue for later
    setTimeout(() => emit({ topic: 'process.later', data: input }), 60000)
    return
  }
  
  // Use a token and process
  rateLimiter.tokens--
  await callExternalAPI(input)
}
```

## Monitoring Background Jobs

### Job Status API
```javascript
// steps/api/jobs/status.step.js
exports.config = {
  type: 'api',
  method: 'GET',
  path: '/jobs/:jobId'
}

exports.handler = async (req, { state }) => {
  const { jobId } = req.pathParams
  
  const job = await state.get('jobs', jobId)
  if (!job) {
    return { status: 404, body: { error: 'Job not found' } }
  }
  
  return { status: 200, body: job }
}
```

### Health Metrics
```javascript
// steps/cron/job-metrics.step.js
exports.config = {
  type: 'cron',
  cron: '*/5 * * * *',  // Every 5 minutes
  emits: ['metrics.collected']
}

exports.handler = async (input, { state, emit }) => {
  const metrics = {
    queued: await countJobs(state, 'queued'),
    processing: await countJobs(state, 'processing'),
    completed: await countJobs(state, 'completed'),
    failed: await countJobs(state, 'failed'),
    timestamp: new Date()
  }
  
  await emit({
    topic: 'metrics.collected',
    data: metrics
  })
}
```

## Testing Background Jobs

```javascript
// tests/process-file.test.js
const { handler } = require('../steps/events/process-file.step')

test('processes file successfully', async () => {
  const input = { fileId: '123', filename: 'test.pdf' }
  
  const context = {
    emit: jest.fn(),
    state: {
      set: jest.fn()
    },
    logger: { info: jest.fn(), error: jest.fn() }
  }
  
  await handler(input, context)
  
  expect(context.emit).toHaveBeenCalledWith({
    topic: 'file.processed',
    data: expect.objectContaining({ fileId: '123' })
  })
})
```

## Next Steps

- Add job queues: See `implement-job-queues.md`
- Schedule recurring jobs: See `schedule-cron-jobs.md`
- Handle failures: See `error-handling.md`
- Monitor performance: See `add-monitoring.md`