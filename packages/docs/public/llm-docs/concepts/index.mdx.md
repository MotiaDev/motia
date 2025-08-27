---
title: Core Concepts
description: Understand the fundamental concepts behind Motia - the unified platform for modern backend systems.
---

# Core Concepts

**Motia unifies what used to require 5+ different frameworks:** APIs, background jobs, workflows, AI agents, real-time streams, and state management - all with built-in observability and multi-language support.

## The Unified Backend Vision

Traditional backend development is fragmented. You need one framework for APIs, another for background jobs, separate tools for queues, workflows, AI agents, and real-time features. Each tool has different configs, different deployment strategies, and different observability approaches.

**Motia changes this.** Everything becomes a **Step** - a single primitive that handles all backend patterns with unified state, events, and observability.

<Callout type="info">
**🌍 The Multi-Language Advantage** 

Use **TypeScript** for APIs, **Python** for AI/ML, **JavaScript** for frontend logic - all in one unified system. Motia handles type safety, validation, and seamless communication between languages automatically.
</Callout>

## 🏗️ **Core Concept 1:** Steps - The Universal Backend Primitive

**Steps are the building blocks of everything in Motia.** Like React components for the frontend, Steps are composable units that handle any backend pattern.

### The Three Step Types

#### 🌐 **API Steps** - HTTP Endpoints & REST APIs
Transform any function into a production-ready API endpoint with automatic validation, error handling, and observability.

```typescript title="user-api.step.ts"
import { Handlers } from 'motia'

// Create a REST API endpoint
export const config = {
  type: 'api' as const,
  path: '/users/:id',
  method: 'GET' as const,
  emits: ['user.fetched']
}

// Handler processes the request
export const handler: Handlers['GetUser'] = async (req, { logger, emit }) => {
  const userId = req.pathParams.id
  logger.info('Fetching user', { userId })
  
  // Emit event for next steps
  await emit({
    topic: 'user.fetched',
    data: { userId, status: 'active' }
  })
  
  return { status: 200, body: { message: 'User fetched' } }
}
```

#### ⚡ **Event Steps** - Background Processing & Workflows  
React to events from other steps. Handle business logic, data processing, AI workflows, and complex orchestration.

```python title="process-user.step.py"
config = {
    'type': 'event',
    'subscribes': ['user.fetched'],
    'emits': ['user.processed']
}

# Process data with Python libraries (pandas, numpy, torch, etc.)
async def handler(user_data, context):
    # Your business logic here
    processed_user = analyze_user_behavior(user_data)
    
    await context.emit({
        'topic': 'user.processed',
        'data': processed_user
    })
```

#### ⏰ **Cron Steps** - Scheduled Jobs & Automation
Run tasks on schedules - from simple cleanups to complex data pipelines and AI agent workflows.

```typescript title="daily-report.step.ts"
import { Handlers } from 'motia'

export const config = {
  type: 'cron',
  schedule: '0 9 * * MON-FRI', // Weekdays at 9 AM
  emits: ['report.generated']
}

// Handler runs on schedule
export const handler: Handlers['DailyReport'] = async (input, { logger, emit }) => {
  logger.info('Generating daily report')
  
  const report = {
    date: new Date().toISOString(),
    metrics: { users: 1250, revenue: 15000 }
  }
  
  await emit({
    topic: 'report.generated',
    data: report
  })
}
```

## 🔄 **Core Concept 2:** Flows - Orchestrating Multi-System Workflows

**Flows organize your steps into logical workflows.** Steps connect through topics - when one step emits an event, other steps can subscribe and react. This creates powerful data pipelines that span multiple languages and services.

<Mermaid
  chart="
graph LR
    A[TypeScript API] --> B[Python AI Agent]
    B --> C[JavaScript Analytics]  
    C --> D[TypeScript Notification]
    
    style A fill:#3178c6,color:#fff
    style B fill:#3776ab,color:#fff  
    style C fill:#f7df1e,color:#000
    style D fill:#3178c6,color:#fff"
/>

### Real-World Flow Example

```typescript title="01-api.step.ts"
import { Handlers } from 'motia'

// API receives request → triggers AI processing → generates analytics → sends notifications
export const config = {
  type: 'api',
  path: '/analyze-document',
  emits: ['document.received'],
  flows: ['document-intelligence']
}

export const handler: Handlers['AnalyzeDocument'] = async (req, { logger, emit }) => {
  logger.info('Document received for analysis')
  
  await emit({
    topic: 'document.received',
    data: { document: req.body, timestamp: new Date() }
  })
  
  return { status: 200, body: { message: 'Document queued for analysis' } }
}
```

```python title="02-ai-processor.step.py"
config = {
    'type': 'event',
    'subscribes': ['document.received'],
    'emits': ['document.analyzed'],
    'flows': ['document-intelligence']
}

# Use Python AI libraries (transformers, torch, etc.)
async def handler(document, context):
    analysis = await ai_model.analyze(document.content)
    await context.emit('document.analyzed', analysis)
```

```javascript title="03-analytics.step.js"
// JavaScript handles final processing and notifications
export const config = {
  type: 'event',
  subscribes: ['document.analyzed'],
  emits: ['analytics.complete'],
  flows: ['document-intelligence']
}

export const handler = async (analysis, { logger, emit }) => {
  logger.info('Processing analytics', { documentId: analysis.id })
  
  const metrics = {
    confidence: analysis.confidence,
    processingTime: Date.now() - analysis.startTime,
    categories: analysis.categories.length
  }
  
  await emit({
    topic: 'analytics.complete',
    data: { documentId: analysis.id, metrics }
  })
}
```

## 🗄️ **Core Concept 3:** State Management - Shared Data Across Languages

**Motia provides built-in state management** that works seamlessly across different programming languages. No need for external databases or complex state synchronization - Motia handles it automatically.

```typescript title="user-state.ts"
export class UserState {
  constructor(private readonly state: InternalStateManager) {}

  async getUser(id: string): Promise<User | null> {
    return this.state.get<User>('user', id)
  }

  async setUser(id: string, user: User) {
    await this.state.set('user', id, user)
  }
}

// In your step handler
export const handler: Handlers['UpdateUser'] = async (req, { state }) => {
  const userState = new UserState(state)
  
  // Update user state
  await userState.setUser('123', {
    status: 'processing',
    lastUpdated: new Date()
  })
}
```

```python title="ai-processor.py"
# Python step reads the same state  
def handler(input_data, context):
    # Access state through context
    user_data = context['state'].get('user', '123')
    print(f"User status: {user_data['status']}")
    
    # Update state from Python
    updated_user = {**user_data, 'aiScore': 0.95}
    context['state'].set('user', '123', updated_user)
```

<Callout type="success">
**🔄 Automatic State Synchronization**

State changes are automatically synchronized across all steps, regardless of the programming language. TypeScript, Python, and JavaScript steps all share the same state seamlessly.
</Callout>

## 🌊 **Core Concept 4:** Real-Time Streams - Live Data to Clients

**Streams provide real-time data flow** from your backend to any client application. Define your data structure once, and Motia automatically streams updates to subscribed clients.

```typescript title="user-activity.stream.ts"
import { StreamConfig } from 'motia'
import { z } from 'zod'

const UserActivitySchema = z.object({
  userId: z.string(),
  activity: z.string(),
  timestamp: z.date()
})

export const config: StreamConfig = {
  name: 'userActivity',
  schema: UserActivitySchema,
  baseConfig: { storageType: 'default' }
}
```

```typescript title="update-activity.step.ts"
// Update stream from any step handler
export const handler: Handlers['UpdateActivity'] = async (req, { streams }) => {
  const activityId = crypto.randomUUID()
  
  // Set data in the stream
  await streams.userActivity.set('activity', activityId, {
    userId: '123',
    activity: 'document-processed',
    timestamp: new Date()
  })
}
```

```javascript title="client.js"
// Client automatically receives real-time updates
import { createStreamClient } from '@motia/stream-client'

const client = createStreamClient({ url: 'ws://localhost:8080' })
const stream = client.subscribe('userActivity')

stream.on('data', (update) => {
  console.log(`User ${update.userId}: ${update.activity}`)
})
```

## 📊 **Core Concept 5:** Built-in Observability - See Everything

**Motia includes enterprise-grade observability** without any configuration. Every step, flow, and state change is automatically tracked and visualized.

### What You Get Out of the Box:

- **🔍 Real-time Flow Visualization** - See your workflows executing live
- **📊 Request Tracing** - Follow data through multi-language steps
- **📈 Performance Metrics** - Automatic monitoring of all steps
- **🐛 Error Tracking** - Centralized error handling and alerting
- **📝 Structured Logging** - Consistent logs across all languages
- **⚡ State Inspection** - Real-time view of shared state

![Motia Workbench](./../img/new-workbench.png)

## The Developer Experience

### Local Development
```bash
npx motia dev
```
- **Visual Workbench** at `http://localhost:3000`
- **Hot reload** for all languages
- **Real-time debugging** of flows and state
- **API testing** interface built-in

### Production Deployment
```bash
motia cloud deploy --api-key <api-key> --version-name <version> [options]
```
- **Atomic deployments** with one-click rollbacks
- **Multi-language builds** handled automatically
- **Infrastructure abstraction** - no cloud provider lock-in
- **Built-in scaling** for each step independently

## Why This Matters

**Before Motia:**
- API Framework (Express, FastAPI, etc.)
- Background Job System (Celery, Bull, etc.)  
- Workflow Engine (Temporal, Airflow, etc.)
- Message Queue (Redis, RabbitMQ, etc.)
- Real-time System (Socket.io, etc.)
- Observability Tools (DataDog, New Relic, etc.)
- State Management (Database + ORM, etc.)

**With Motia:**
- **One framework** handles everything
- **One config** file per step
- **One deployment** command
- **One observability** interface
- **One state system** across all languages

---

**Ready to see this in action?** Check out [API Endpoints](/docs/getting-started/build-your-first-app/creating-your-first-rest-api) to build a complete REST API in minutes.