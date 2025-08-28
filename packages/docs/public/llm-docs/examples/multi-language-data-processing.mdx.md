---
title: 'Multi-Language Data Processing: Building Event-Driven Pipelines with TypeScript, Python & JavaScript'
---

Modern backend development often requires combining the strengths of different programming languages. TypeScript for APIs, Python for data processing and AI, JavaScript for rapid prototyping. Traditional approaches involve complex microservices architectures with intricate communication patterns.

This comprehensive guide explores how to build a unified multi-language data processing pipeline using Motia's **step** primitive. We'll cover:

1. **Steps as Core Primitive**: How steps unify different languages under a single abstraction.
2. **Building the Pipeline**: A step-by-step guide to creating a cohesive multi-language data processing workflow.
3. **Unified Execution Model**: How steps enable seamless communication between different runtime environments.
4. **Hands-On Development**: How to build, run, and observe your unified multi-language pipeline.

Let's build a production-ready data processing system where steps unify TypeScript, Python, and JavaScript into a single cohesive workflow.

---

## The Power of Steps: A Unified Multi-Language Primitive

<div className="my-8">![Multi-Language Data Processing in Motia Workbench](/docs-images/motia-build-your-app-2.gif)</div>

At its core, our data processing pipeline demonstrates how **steps** solve the fundamental challenge of multi-language systems: unifying different programming languages under a single, coherent abstraction. Traditional polyglot architectures require complex inter-process communication and deployment coordination. Motia's **step** primitive unifies everything.

**Steps enable true language unification:**

- **[TypeScript](https://www.typescriptlang.org/)** steps: Strong typing and excellent tooling for APIs and orchestration
- **[Python](https://www.python.org/)** steps: Rich ecosystem for data processing, ML, and scientific computing  
- **[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)** steps: Dynamic processing and rapid development
- **[Motia's Step Primitive](https://motia.dev)**: The unifying abstraction that makes all languages work as a single system

Instead of managing multiple services, **steps** provide a single programming model. Whether written in TypeScript, Python, or JavaScript, every step follows the same pattern: receive data, process it, emit events. This unification is what makes multi-language development straightforward.

---

## The Anatomy of Our Multi-Language Pipeline

Our application consists of five specialized steps, each leveraging the optimal language for its specific task. Let's explore the complete architecture.

<Folder name="steps" defaultOpen>
  <File name="01-starter.step.ts" />
  <File name="02-bridge.step.ts" />
  <File name="simple-python.step.py" />
  <File name="notify.step.ts" />
  <File name="04-final.step.ts" />
  <File name="05-summary.step.js" />
</Folder>

<Folder name="types" defaultOpen>
  <File name="index.ts" />
</Folder>

<Tabs items={['api-starter', 'bridge-step', 'python-processor', 'notification-handler', 'finalizer', 'summary-generator']}>
  <Tab value="api-starter">
    The entry point for our multi-language workflow. This TypeScript API endpoint receives data, validates it with Zod schemas, and kicks off the processing pipeline.

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

  </Tab>
  <Tab value="bridge-step">
    A TypeScript bridge that receives the app start event, processes the data, and forwards it to the Python processing step with proper type transformation.

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

  </Tab>
  <Tab value="python-processor">
    The core data processor written in Python, demonstrating how Python steps integrate seamlessly with the TypeScript workflow while maintaining access to Python's rich ecosystem.

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

  </Tab>
  <Tab value="notification-handler">
    A TypeScript notification handler that processes the Python results and sends notifications, showing seamless data flow between Python and TypeScript.

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

  </Tab>
  <Tab value="finalizer">
    A TypeScript finalizer that aggregates all the processing results and prepares the final summary data before handing off to JavaScript for metrics generation.

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

  </Tab>
  <Tab value="summary-generator">
    The final step uses JavaScript for dynamic summary generation and metrics calculation, showcasing how all three languages work together in a single workflow.

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

  </Tab>
</Tabs>

---

## Explore the Workbench

The Motia Workbench provides a visual representation of your multi-language pipeline, making it easy to trace data flow between TypeScript, Python, and JavaScript steps.

<div className="my-8">![Multi-Language Workflow in Motia Workbench](/docs-images/motia-build-your-app-2.gif)</div>

You can monitor real-time execution, view logs from all languages in a unified interface, and trace the complete data flow from the TypeScript API through Python processing to JavaScript summary generation.

---

## Key Features & Benefits

### 🧩 **Step as Universal Primitive**
Every piece of logic—whether TypeScript, Python, or JavaScript—follows the same step pattern, creating true unification.

### 🌐 **Seamless Language Integration**
Steps eliminate the complexity of multi-language systems by providing a unified programming model.

### 📊 **Unified Development Experience**
Write, debug, and monitor all languages through a single interface and shared execution model.

### ⚡ **Hot Reload Across Languages**
Edit any step in any language and see changes instantly across the entire pipeline.

### 🔄 **Event-Driven Communication**
Steps communicate through events, enabling loose coupling and independent scaling.

### 🎯 **Single Deployment Model**
Deploy all languages together as a cohesive system, not as separate microservices.

---

## Trying It Out

Ready to build your first multi-language Motia application? Let's get it running.

<Steps>

### Create Your Motia App

Start by creating a new Motia project with the interactive setup.

```shell
npx motia@latest create -i
```

### Navigate and Start Development

Move into your project directory and start the development server.

```shell
cd my-app  # Replace with your project name
npx motia dev
```

### Open the Workbench

Navigate to [`http://localhost:3000`](http://localhost:3000) to access the Workbench and run your workflow.

### Test the Multi-Language Pipeline

Send a request to your API endpoint to see the multi-language workflow in action:

```shell
curl -X POST http://localhost:3000/start-app \
  -H "Content-Type: application/json" \
  -d '{"data":{"message":"Hello multi-language world!","value":42}}'
```

Watch in the Workbench as your data flows through:
1. **TypeScript** validation and event emission
2. **TypeScript** bridge processing and forwarding  
3. **Python** data processing with rich logging
4. **TypeScript** notification handling
5. **TypeScript** finalization and aggregation
6. **JavaScript** summary generation and metrics

</Steps>

---

## 💻 Dive into the Code

Want to explore multi-language workflows further? Check out additional examples and the complete source code:

<div className="not-prose">
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 my-6">
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">
        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Language Examples</h3>
        <p className="text-gray-600 mb-4">Access complete multi-language implementations, configuration examples, and learn how to integrate TypeScript, Python, and JavaScript in production applications.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href="https://github.com/MotiaDev/motia-examples" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Explore Examples
          </a>
          <a 
            href="/docs/getting-started/quick-start" 
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors duration-200"
          >
            Quick Start →
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

---

## Conclusion: The Power of Unification Through Steps

This multi-language data processing pipeline demonstrates how **steps** fundamentally change multi-language development. By providing a single primitive that works across TypeScript, Python, and JavaScript, we've eliminated the traditional complexity of polyglot architectures.

**The step primitive enables true unification:**
- **Universal Pattern** - Every step, regardless of language, follows the same receive-process-emit pattern
- **Seamless Integration** - Add Ruby, Go, Rust, or any language using the same step abstraction
- **Unified Deployment** - All languages deploy together as a single, coherent system
- **Shared Development Model** - Write, debug, and monitor everything through the same interface

**Key benefits of step-based unification:**
- **Single Mental Model** - Learn the step pattern once, apply it to any language
- **Cohesive System** - All components work together as parts of one application, not separate services
- **Consistent Experience** - Development, debugging, and monitoring work the same way across all languages
- **Natural Scaling** - Each step can scale independently while maintaining system coherence

**Extend your pipeline with more steps:**
- Add specialized processing steps for different data types and business logic
- Integrate machine learning workflows with Python steps for AI processing
- Build real-time analytics with streaming steps for live data processing
- Connect to enterprise systems through database and API integration steps
- Implement scheduled processing with cron steps for batch operations

The **step primitive** makes all extensions natural and straightforward—every new capability follows the same unified pattern.

Ready to unify your multi-language systems? Start building with steps today!
