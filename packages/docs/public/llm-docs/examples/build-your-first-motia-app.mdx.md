---
title: Build Your First Motia App
description: Build your first multi-language Motia app in minutes. This guide walks you through creating, running, and understanding a Motia app using JavaScript, TypeScript, and Python.
---

# Build Your First Motia App

**Get up and running with Motia in just a few minutes!** This guide shows you how to create a Motia app that connects JavaScript, TypeScript, and Python as steps.

## What You'll Build

A simple data processing Motia app:
- **TypeScript** API endpoint receives data with validation
- **TypeScript** bridges and notifies with proper types
- **Python** processes the data with proper logging
- **JavaScript** generates final summary and metrics

All connected automatically with zero configuration and strict type safety.

## Step 1: Create Your Motia App

```bash
# Create a new Motia app
npx motia@latest create -i
```
![Create App Command](/docs-images/motia-build-your-app-1.gif)

```bash
# Change directory to my-app
cd my-app
```
![run dev command](/docs-images/motia-build-your-app-2.png)

```bash
### Start the development environment
npx motia dev
```
![run starter app](/docs-images/motia-build-your-app.gif)


✅ That's it! You now have a working Motia app with a visual debugger at `http://localhost:3000`

## Step 2: Add Environment Variables (Optional)

If you want to use external APIs, create a `.env` file:

```bash title=".env"
# Only add these if you need external services
OPENAI_API_KEY=sk-your-api-key-here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook
```

<Callout type="info">
The basic tutorial works without any API keys. Add environment variables only if you want to integrate external services.

**➡️ [Learn about Environment Variables](/docs/concepts/environment-variables)**
</Callout>

## Step 3: Add Your Logic Steps

### TypeScript API Endpoint (App Starter)
// File: 01-starter.step.ts
```typescript
import { Handlers } from 'motia'
import { z } from 'zod'
import { StartAppRequest, StartAppResponse, AppData } from '../types'

const bodySchema = z.object({
  data: z.record(z.unknown()).optional(),
  message: z.string().optional()
})

// Basic app starter - TypeScript API endpoint
export const config = {
  type: 'api',
  name: 'appStarter',
  description: 'Start the basic multi-language app',

  method: 'POST',
  path: '/start-app',

  emits: ['app.started'],
  flows: ['data-processing'],
  
  bodySchema,
  responseSchema: {
    200: z.object({
      message: z.string(),
      appId: z.number(),
      traceId: z.string()
    })
  }
} as const

export const handler: Handlers['appStarter'] = async (req, { logger, emit, traceId }) => {
  logger.info('🚀 Starting basic app', { body: req.body, traceId })
  
  const validationResult = bodySchema.safeParse(req.body)
  
  if (!validationResult.success) {
    logger.error('Invalid request body', { errors: validationResult.error.errors })
    return { 
      status: 400, 
      body: { 
        message: 'Invalid request body', 
        errors: validationResult.error.errors 
      } 
    }
  }
  
  const appData: AppData = {
    id: Date.now(),
    input: validationResult.data.data || {},
    started_at: new Date().toISOString(),
    traceId: traceId
  }
  
  // Emit to start the app
  await emit({
    topic: 'app.started',
    data: appData
  })
  
  logger.info('app initiated successfully', { appId: appData.id })
  
  const response: StartAppResponse = {
    message: 'Basic app started successfully',
    appId: appData.id,
    traceId: traceId
  }
  
  return {
    status: 200,
    body: response
  }
} 
```

### TypeScript Bridge Step
// File: 02-bridge.step.ts
```typescript
import { Handlers } from 'motia'
import { AppData, ProcessedResult } from '../types'

// Bridge step to connect app starter to Python processing
export const config = {
  type: 'event',
  name: 'appBridge',
  description: 'Bridge between app start and Python processing',
  
  subscribes: ['app.started'],
  emits: ['data.processed'],
  
  flows: ['data-processing']
} as const

export const handler: Handlers['appBridge'] = async (input, { logger, emit }) => {
  logger.info('🌉 Processing app data and sending to Python', { appId: input.id })
  
  // Process data for Python step
  const processedResult: ProcessedResult = {
    original_id: input.id,
    processed_at: input.started_at,
    result: `Processed: ${JSON.stringify(input.input)}`,
    confidence: 0.95,
    model_version: 'v2.1-ts'
  }
  
  // Send to Python step for async processing
  await emit({
    topic: 'data.processed',
    data: processedResult
  })
  
  logger.info('Data sent to Python step for processing', { dataId: processedResult.original_id })
} 
```

### Python Data Processor
// File: simple-python.step.py
```python
# process-data.step.py
config = {
    'type': 'event',
    'name': 'ProcessDataPython',
    'description': 'Process incoming data and emit python.done',
    'subscribes': ['data.processed'],
    'emits': ['python.done'],
    'flows': ['data-processing']
}

async def handler(input_data, context):
    """
    Process data received from TypeScript bridge step
    
    Args:
        input_data: ProcessedResult with original_id, processed_at, result, confidence, model_version
        context: Motia context with emit, logger, etc.
    """
    try:
        # Validate required fields
        required_fields = ['original_id', 'processed_at', 'result']
        for field in required_fields:
            if field not in input_data:
                raise ValueError(f"Missing required field: {field}")
        
        context.logger.info("🐍 Processing data", {
            "id": input_data['original_id'],
            "confidence_level": input_data.get('confidence', 'N/A'),
            "model_version": input_data.get('model_version', 'unknown'),
        })

        # Process the data (simulate complex Python processing)
        python_result = {
            'id': input_data['original_id'],
            'python_message': f"Python processed: {input_data['result']}",
            'processed_by': 'python-step',
            'timestamp': input_data['processed_at']
        }

        context.logger.info(f"🐍 Processing complete, emitting python.done event")

        # Emit with topic and data in dictionary format
        await context.emit({"topic": "python.done", "data": python_result})

        context.logger.info("🐍 Event emitted successfully", { "id": python_result['id'] })

        # Return the payload so Motia passes it along automatically
        return python_result
        
    except Exception as e:
        context.logger.error(f"🐍 Error processing data: {str(e)}")
        # Re-raise the exception to let Motia handle it
        raise
```

### TypeScript Notification Step
// File: notify.step.ts
```typescript
import { Handlers } from 'motia'
import { PythonResult, NotificationData } from '../types'

export const config = {
  type: 'event',
  name: 'NotificationHandler',
  description: 'Send notifications after Python processing',
  
  subscribes: ['python.done'],
  emits: ['notification.sent'],
  
  flows: ['data-processing']
} as const

export const handler: Handlers['NotificationHandler'] = async (input, { logger, emit }) => {
  logger.info('📧 Sending notifications after Python processing:', { id: input.id })
  
  // Simulate sending notifications (email, slack, etc.)
  const notification: NotificationData = {
    id: input.id,
    message: `Notification: ${input.python_message}`,
    processed_by: input.processed_by,
    sent_at: new Date().toISOString()
  }
  
  // Trigger final step
  await emit({
    topic: 'notification.sent',
    data: notification
  })
  
  logger.info('Notification sent successfully', notification)
}
```

### TypeScript Finalizer Step
// File: 04-final.step.ts
```typescript
import { Handlers } from 'motia'
import { NotificationData, AppSummary } from '../types'

// Final step to complete the app - TypeScript
export const config = {
  type: 'event',
  name: 'appFinalizer',
  description: 'Complete the basic app and log final results',
  
  subscribes: ['notification.sent'],
  emits: ['app.completed'],
  
  flows: ['data-processing']
} as const

export const handler: Handlers['appFinalizer'] = async (input, { logger, emit }) => {
  logger.info('🏁 Finalizing app', { 
    notificationId: input.id,
    message: input.message 
  })
  
  // Create final app summary
  const summary: AppSummary = {
    appId: input.id,
    status: 'completed',
    completed_at: new Date().toISOString(),
    steps_executed: [
      'appStarter (TypeScript)',
      'appBridge (TypeScript)', 
      'ProcessDataPython (Python)',
      'NotificationHandler (TypeScript)',
      'appFinalizer (TypeScript)',
      'summaryGenerator (JavaScript)'
    ],
    result: input.message
  }
  
  // Emit completion event
  await emit({
    topic: 'app.completed',
    data: summary
  })
  
  logger.info('✅ Basic app completed successfully', summary)
} 
```

### JavaScript Summary Generator
// File: 05-summary.step.js
```javascript
// Final summary step - JavaScript
export const config = {
  type: 'event',
  name: 'summaryGenerator',
  description: 'Generate final summary in JavaScript',
  
  subscribes: ['app.completed'],
  emits: ['summary.generated'],
  
  flows: ['data-processing']
}

export const handler = async (input, { logger, emit }) => {
  logger.info('📊 Generating final summary in JavaScript', { 
    appId: input.appId,
    status: input.status 
  })
  
  // Calculate processing metrics
  const processingTime = new Date() - new Date(input.completed_at)
  const stepsCount = input.steps_executed.length
  
  // Create comprehensive summary
  const summary = {
    appId: input.appId,
    finalStatus: input.status,
    totalSteps: stepsCount,
    processingTimeMs: Math.abs(processingTime),
    languages: ['TypeScript', 'Python', 'JavaScript'],
    summary: `Multi-language app completed successfully with ${stepsCount} steps`,
    result: input.result,
    completedAt: new Date().toISOString(),
    generatedBy: 'javascript-summary-step'
  }
  
  // Emit final summary
  await emit({
    topic: 'summary.generated',
    data: summary
  })
  
  logger.info('✨ Final summary generated successfully', summary)
  
  return summary
}
```

## What Happens Next?

![motia-build-your-app](/docs-images/motia-build-your-app-2.gif)

Watch in the **Workbench** (`http://localhost:3000`) as your data flows through:

1. **TypeScript** API receives and validates the request
2. **TypeScript** bridge processes and forwards data
3. **Python** processes it with proper logging (access to numpy, pandas, torch, etc.)
4. **TypeScript** handles notifications with full type safety
5. **JavaScript** generates final summary with metrics

All languages working together in one unified system with:
- ✅ **Automatic observability** - see every step in real-time
- ✅ **Built-in error handling** - retry logic included
- ✅ **Shared state** - pass data between languages effortlessly
- ✅ **Hot reload** - edit any file and see changes instantly
- ✅ **Type safety** - proper TypeScript types throughout
- ✅ **Input validation** - Zod schema validation for APIs
- ✅ **Multi-language** - JavaScript, TypeScript, and Python working together

## Deploy and Extend

**You just built a production-ready multi-language Motia app!**

Extend your app:
- Add scheduled jobs with `cron` steps
- Create UI components with React/Vue steps
- Connect to databases, APIs, and external services
- Scale to handle millions of requests

Ready to deploy? Check out [Motia Cloud deployment](/docs/concepts/deployment/motia-cloud) for one-click production deployments.

<Callout>
**Ready to build more?** Check out our [Getting Started Guide](/docs/getting-started/quick-start) for more details.
</Callout>

---

**The bottom line:** Motia eliminates the complexity of managing separate runtimes. Write each piece in the best language for the job, and Motia handles the rest.
