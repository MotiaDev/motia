---
title: Project Structure
description: Learn about Motia's project structure, file organization, and automatic step discovery system for building scalable workflow applications.
---

# Project Structure

Understanding how to organize your Motia project is crucial for building maintainable and scalable workflow applications. This guide covers the directory structure, file naming conventions, and Motia's automatic step discovery system.

## Basic Project Structure

Here's what a typical Motia project looks like:

<Folder name="my-motia-project" defaultOpen>
  <Folder name="steps (default)" defaultOpen>
    <File name="01-api-gateway.step.ts" />
    <File name="02-data-processor.step.py" />  
    <File name="03-send-notification.step.js" />
    <File name="custom-ui.step.tsx" />
  </Folder>
  <File name="package.json" />
  <File name="requirements.txt" />
  <File name="tsconfig.json" />
  <File name="types.d.ts" />
  <File name="motia-workbench.json" />
  <File name="config.yml" />
</Folder>

### File Descriptions

| File | Purpose | Type | Auto-Generated |
|------|---------|------|----------------|
| `01-api-gateway.step.ts` | TypeScript API endpoint | User Code | - |
| `02-data-processor.step.py` | Python data processing | User Code | - |
| `03-send-notification.step.js` | JavaScript automation | User Code | - |
| `custom-ui.step.tsx` | Optional UI component | User Code | - |
| `package.json` | Node.js dependencies (if using JS/TS) | Config | - |
| `requirements.txt` | Python dependencies (if using Python) | Config | - |
| `tsconfig.json` | TypeScript config (if using TypeScript) | Config | - |
| `types.d.ts` | **Type definitions for your project** | **Generated** | **✅ By TypeScript** |
| `motia-workbench.json` | **🤖 Visual workflow positioning** | **Generated** | **✅ By Motia** |
| `config.yml` | Optional Motia configuration | Config | - |

<Callout type="info">
The `steps/` directory is the heart of your Motia application - this is where all your workflow logic lives. Motia automatically discovers and registers any file following the naming pattern.

**Note:** The `steps/` directory is the default location, but you can customize this to use any directory name(s) you prefer. See the [Configuring Step Directories](#configuring-step-directories) section below for details.
</Callout>

<Callout>
<strong>Location and nesting rules</strong>

- The `steps/` directory must live at the <em>project root</em> (e.g., `my-motia-project/steps`).
- You can freely nest steps in subfolders under `steps/` (e.g., `steps/aaa/a1.step.ts`, `steps/bbb/ccc/c1.step.py`).
- Discovery is recursive inside `steps/`, so deeper folder structures for large apps are supported.
</Callout>

## Configuring Step Directories

By default, Motia searches for step files in the `steps/` directory at your project root. However, you can customize this to use any directory structure that fits your project's needs.

<Callout type="info">
**Backward Compatibility:** Existing projects using the `steps/` directory will continue to work without any changes. The default behavior remains unchanged.
</Callout>

### Using Environment Variables

Configure custom step directories using the `MOTIA_STEP_DIRS` environment variable:

```bash
# Single custom directory
export MOTIA_STEP_DIRS=src
npx motia dev

# Multiple directories
export MOTIA_STEP_DIRS=api-steps,worker-steps,cron-steps
npx motia dev
```

You can also set this in your `.env` file:

```bash title=".env"
MOTIA_STEP_DIRS=api-steps,worker-steps,cron-steps
```

### Using CLI Options

Override the environment variable with the `--step-dirs` CLI option:

```bash
# Single directory
npx motia dev --step-dirs "src"

# Multiple directories
npx motia dev --step-dirs "api-steps,worker-steps"

# Works with build and start commands too
npx motia build --step-dirs "src"
npx motia start --step-dirs "api-steps,worker-steps"
```

### Single Custom Directory Example

<Folder name="my-motia-project" defaultOpen>
  <Folder name="src" defaultOpen>
    <File name="api-gateway.step.ts" />
    <File name="data-processor.step.py" />
    <File name="notification.step.js" />
  </Folder>
  <File name="package.json" />
  <File name=".env" />
</Folder>

```bash title=".env"
MOTIA_STEP_DIRS=src
```

### Multiple Directories Example

<Folder name="my-motia-project" defaultOpen>
  <Folder name="api-steps" defaultOpen>
    <File name="users.step.ts" />
    <File name="products.step.ts" />
  </Folder>
  <Folder name="worker-steps" defaultOpen>
    <File name="process-orders.step.py" />
    <File name="send-emails.step.js" />
  </Folder>
  <Folder name="cron-steps" defaultOpen>
    <File name="daily-report.step.ts" />
    <File name="cleanup.step.py" />
  </Folder>
  <File name="package.json" />
  <File name=".env" />
</Folder>

```bash title=".env"
MOTIA_STEP_DIRS=api-steps,worker-steps,cron-steps
```

## Automatic Step Discovery

<Callout type="default">
**Key Concept: Automatic Discovery** 

Motia will automatically discover and register **any file** that follows the `.step.` naming pattern as a workflow step. You don't need to manually register steps - just create a file with the right naming pattern and Motia will find it.
</Callout>

### Discovery Rules

Motia scans your configured step directories (default: `steps/`) and automatically registers files as steps based on these rules:

1. **File must contain `.step.` or `_step.` in the filename** (e.g., `my-task.step.ts`, `my_task_step.py`)
2. **File must export a `config` object** defining the step configuration
3. **File must export a `handler` function** containing the step logic
4. **File extension determines the runtime** (`.ts` = TypeScript, `.py` = Python, `.js` = JavaScript)
5. **Discovery works across all configured directories** - if you've set multiple directories via `MOTIA_STEP_DIRS` or `--step-dirs`, Motia will search all of them

When you run `motia dev`, Motia will:
- Scan all configured step directories recursively
- Find all files matching `*.step.*` in each directory
- Parse their `config` exports to understand step types and connections
- Register them in the workflow engine
- Make them available in the Workbench

## File Naming Convention

Motia uses this specific pattern for automatic step discovery:

```
[prefix-]descriptive-name.step.[extension]
```

<Callout type="warning">
The `.step.` part in the filename is **required** - this is how Motia identifies which files are workflow steps during automatic discovery.
</Callout>

### Supported Languages & Extensions

| Language | Extension | Example Step File | Runtime |
|----------|-----------|-------------------|---------|
| **TypeScript** | `.ts` | `user-registration.step.ts` | Node.js with TypeScript |
| **Python** | `.py` | `data-analysis.step.py` | Python interpreter |
| **JavaScript** | `.js` | `send-notification.step.js` | Node.js |

### Naming Examples by Step Type

| Step Type | TypeScript | Python | JavaScript |
|-----------|------------|---------|-----------|
| **API Endpoint** | `01-auth-api.step.ts` | `01-auth-api.step.py` or `auth_api_step.py` | `01-auth-api.step.js` |
| **Event Handler** | `process-order.step.ts` | `process-order.step.py` or `process_order_step.py` | `process-order.step.js` |
| **Cron Job** | `daily-report.step.ts` | `daily-report.step.py` or `daily_report_step.py` | `daily-report.step.js` |
| **Data Processing** | `transform-data.step.ts` | `ml-analysis.step.py` or `ml_analysis_step.py` | `data-cleanup.step.js` |

## Step Organization Patterns

<Tabs items={["Sequential", "Feature-Based", "Language-Specific", "Multiple Directories"]}>
<Tab value="Sequential">

### Sequential Flow Organization
Perfect for linear workflows where order matters:

<Folder name="steps" defaultOpen>
  <File name="01-api-start.step.ts" />
  <File name="02-validate-data.step.py" />
  <File name="03-process-payment.step.js" />
  <File name="04-send-confirmation.step.ts" />
  <File name="05-cleanup.step.py" />
</Folder>

| Step | Language | Purpose |
|------|----------|---------|
| `01-api-start.step.ts` | TypeScript | API endpoint |
| `02-validate-data.step.py` | Python | Data validation |
| `03-process-payment.step.js` | JavaScript | Payment processing |
| `04-send-confirmation.step.ts` | TypeScript | Email service |
| `05-cleanup.step.py` | Python | Cleanup tasks |

</Tab>
<Tab value="Feature-Based">

### Feature-Based Organization
Organize by business domains for complex applications:

<Folder name="steps" defaultOpen>
  <Folder name="authentication" defaultOpen>
    <File name="login.step.ts" />
    <File name="verify-token.step.py" />
    <File name="logout.step.js" />
  </Folder>
  <Folder name="payment" defaultOpen>
    <File name="process-payment.step.ts" />
    <File name="fraud-detection.step.py" />
    <File name="webhook.step.js" />
  </Folder>
  <Folder name="notification" defaultOpen>
    <File name="email.step.py" />
    <File name="sms.step.js" />
    <File name="push.step.ts" />
  </Folder>
</Folder>

**Benefits:**
- Logical grouping by business domain
- Easy to locate related functionality
- Team ownership by feature area
- Independent scaling and deployment

</Tab>
<Tab value="Language-Specific">

### Language-Specific Organization
Group by programming language for team specialization:

<Folder name="steps" defaultOpen>
  <Folder name="typescript" defaultOpen>
    <File name="api-gateway.step.ts" />
    <File name="user-management.step.ts" />
    <File name="data-validation.step.ts" />
  </Folder>
  <Folder name="python" defaultOpen>
    <File name="ml-processing.step.py" />
    <File name="data-analysis.step.py" />
    <File name="image-processing.step.py" />
  </Folder>
  <Folder name="javascript" defaultOpen>
    <File name="automation.step.js" />
    <File name="webhook-handlers.step.js" />
    <File name="integrations.step.js" />
  </Folder>
</Folder>

**Benefits:**
- Team specialization by language
- Consistent tooling and patterns
- Easy onboarding for language experts
- Shared libraries and utilities

</Tab>
<Tab value="Multiple Directories">

### Multiple Directories Organization
Separate steps across multiple root-level directories for advanced organizational needs:

#### Monorepo Pattern

Ideal for large-scale applications with multiple packages:

<Folder name="my-monorepo" defaultOpen>
  <Folder name="packages" defaultOpen>
    <Folder name="api" defaultOpen>
      <Folder name="steps" defaultOpen>
        <File name="users.step.ts" />
        <File name="products.step.ts" />
      </Folder>
    </Folder>
    <Folder name="workers" defaultOpen>
      <Folder name="steps" defaultOpen>
        <File name="process-orders.step.py" />
        <File name="send-emails.step.js" />
      </Folder>
    </Folder>
  </Folder>
  <File name=".env" />
</Folder>

```bash title=".env"
MOTIA_STEP_DIRS=packages/api/steps,packages/workers/steps
```

**Benefits:**
- Clear package boundaries
- Independent versioning and deployment
- Shared code and utilities per package
- Scalable for large teams

#### Team Separation Pattern

Organize by team ownership for collaborative development:

<Folder name="my-project" defaultOpen>
  <Folder name="team-auth-steps" defaultOpen>
    <File name="login.step.ts" />
    <File name="register.step.ts" />
    <File name="verify-email.step.py" />
  </Folder>
  <Folder name="team-payments-steps" defaultOpen>
    <File name="process-payment.step.ts" />
    <File name="refund.step.js" />
    <File name="webhooks.step.py" />
  </Folder>
  <Folder name="team-notifications-steps" defaultOpen>
    <File name="email.step.js" />
    <File name="sms.step.py" />
    <File name="push.step.ts" />
  </Folder>
  <File name=".env" />
</Folder>

```bash title=".env"
MOTIA_STEP_DIRS=team-auth-steps,team-payments-steps,team-notifications-steps
```

**Benefits:**
- Clear team ownership
- Reduced merge conflicts
- Team-specific workflows
- Easier code reviews

#### Environment/Layer Separation Pattern

Separate by architectural layers or deployment environments:

<Folder name="my-project" defaultOpen>
  <Folder name="src" defaultOpen>
    <Folder name="api-steps" defaultOpen>
      <File name="rest-endpoints.step.ts" />
      <File name="graphql.step.ts" />
    </Folder>
    <Folder name="background-steps" defaultOpen>
      <File name="data-processing.step.py" />
      <File name="report-generation.step.js" />
    </Folder>
    <Folder name="cron-steps" defaultOpen>
      <File name="daily-cleanup.step.ts" />
      <File name="weekly-reports.step.py" />
    </Folder>
  </Folder>
  <File name=".env" />
</Folder>

```bash title=".env"
MOTIA_STEP_DIRS=src/api-steps,src/background-steps,src/cron-steps
```

**Benefits:**
- Clear architectural separation
- Easier to understand system layout
- Independent scaling strategies
- Better deployment control

</Tab>
</Tabs>

## Language-Specific Configuration

### TypeScript/JavaScript Projects

For Node.js-based steps, you'll need:

```json title="package.json"
{
  "name": "my-motia-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "motia dev",
    "build": "motia build",
    "start": "motia start"
  },
  "dependencies": {
    "motia": "^0.5.12-beta.121",
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "@types/node": "^20.0.0"
  }
}
```

```json title="tsconfig.json (for TypeScript)"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

### Python Projects

For Python-based steps:

```text title="requirements.txt"
# Core Motia dependency
motia>=0.5.12

# Common dependencies
requests>=2.28.0
pydantic>=1.10.0

# Data processing (if needed)
pandas>=1.5.0
numpy>=1.21.0
```

## Step Discovery Examples

Let's see how Motia discovers different step types:

### Example 1: TypeScript API Step

```typescript title="steps/user-api.step.ts"
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

// Motia discovers this file because:
// 1. Filename contains '.step.'
// 2. Exports 'config' object
// 3. Has .ts extension -> uses TypeScript runtime
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'user-api',
  path: '/users',
  method: 'GET',
  emits: ['users.fetched'],
  flows: ['user-management']
}

export const handler: Handlers['user-api'] = async (req, { emit }) => {
  await emit({
    topic: 'users.fetched', 
    data: { users: [] }
  })
  
  return {
    status: 200,
    body: { message: 'Users retrieved' }
  }
}
```

### Example 2: Python Event Step

```python title="steps/data-processor.step.py"
# Motia discovers this file because:
# 1. Filename contains '.step.'  
# 2. Exports 'config' dict
# 3. Has .py extension -> uses Python runtime

config = {
    "type": "event",
    "name": "data-processor",
    "description": "Process incoming data with Python",
    "subscribes": ["users.fetched"],
    "emits": ["data.processed"],
    "flows": ["user-management"]
}

async def handler(input_data, ctx):
    """Process the data"""
    processed_data = {
        "original": input_data,
        "processed_at": ctx.utils.dates.now().isoformat(),
        "count": len(input_data.get("users", []))
    }
    
    await ctx.emit({
        "topic": "data.processed",
        "data": processed_data
    })
```

### Example 3: JavaScript Automation Step

```javascript title="steps/send-notifications.step.js"
// Motia discovers this file because:
// 1. Filename contains '.step.'
// 2. Exports 'config' object  
// 3. Has .js extension -> uses Node.js runtime

export const config = {
  type: 'event',
  name: 'send-notifications',
  description: 'Send notifications via multiple channels',
  subscribes: ['data.processed'],
  emits: ['notifications.sent'],
  flows: ['user-management']
}

export const handler = async (input, { emit, logger }) => {
  logger.info('Sending notifications', { data: input })
  
  // Send email, SMS, push notifications, etc.
  const results = await Promise.all([
    sendEmail(input),
    sendSMS(input),
    sendPush(input)
  ])
  
  await emit({
    topic: 'notifications.sent',
    data: { 
      results,
      sent_at: new Date().toISOString() 
    }
  })
}

async function sendEmail(data) { /* implementation */ }
async function sendSMS(data) { /* implementation */ }  
async function sendPush(data) { /* implementation */ }
```

## Auto-Generated Files

Some files in your Motia project are automatically generated:

- `types.d.ts` - TypeScript generates this for type definitions
- `motia-workbench.json` - Motia manages visual node positions in the Workbench

## Multi-Language Project Example

Here's a real-world example showing how the three languages work together:

<Folder name="ecommerce-platform" defaultOpen>
  <Folder name="steps" defaultOpen>
    <Folder name="api" defaultOpen>
      <File name="product-catalog.step.ts" />
      <File name="user-auth.step.ts" />
      <File name="order-management.step.ts" />
    </Folder>
    <Folder name="processing" defaultOpen>
      <File name="inventory-sync.step.py" />
      <File name="recommendation.step.py" />
      <File name="fraud-detection.step.py" />
    </Folder>
    <Folder name="automation" defaultOpen>
      <File name="email-campaigns.step.js" />
      <File name="order-fulfillment.step.js" />
      <File name="customer-support.step.js" />
    </Folder>
    <Folder name="integrations" defaultOpen>
      <File name="payment-webhook.step.ts" />
      <File name="warehouse-sync.step.py" />
      <File name="social-media.step.js" />
    </Folder>
  </Folder>
  <File name="package.json" />
  <File name="requirements.txt" />
  <File name="tsconfig.json" />
  <File name="config.yml" />
</Folder>

### Architecture Breakdown

| Layer | Language | Purpose | Examples |
|-------|----------|---------|----------|
| **API Layer** | TypeScript | Fast API responses, type safety | Product catalog, user auth, order management |
| **Processing Layer** | Python | Data processing, ML, analytics | Inventory sync, recommendations, fraud detection |
| **Automation Layer** | JavaScript | Business automation, workflows | Email campaigns, fulfillment, customer support |
| **Integration Layer** | Multi-language | External system connections | Payment webhooks, ERP sync, social media |

## Language Strengths & When to Use

| Language | Best For | Common Step Types | Example Use Cases |
|----------|----------|-------------------|------------------|
| **TypeScript** | API endpoints, type safety, web integrations | API, Event, UI | REST APIs, webhooks, data validation |
| **Python** | Data science, ML, automation, integrations | Event, Cron | Data analysis, AI models, file processing |
| **JavaScript** | Automation, integrations, general scripting | Event, Cron | Email automation, webhooks, social media |

## Discovery Troubleshooting

If Motia isn't discovering your steps:

### Common Issues

<Tabs items={["Filename Issues", "Export Issues", "Location Issues"]}>
<Tab value="Filename Issues">

**Missing `.step.` in filename**

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
❌ **Won't be discovered:**
<Folder name="steps" defaultOpen>
  <File name="user-handler.ts" />
  <File name="data-processor.py" />
  <File name="webhook.js" />
</Folder>
</div>
<div>
✅ **Will be discovered:**
<Folder name="steps" defaultOpen>
  <File name="user-handler.step.ts" />
  <File name="data-processor.step.py" />
  <File name="webhook.step.js" />
</Folder>
</div>
</div>

</Tab>
<Tab value="Export Issues">

**Missing config export**

```typescript title="❌ Won't be discovered"
// No config export
export const handler = async () => {
  console.log('This won't be found by Motia')
}
```

```typescript title="✅ Will be discovered"
// Proper exports
export const config = {
  type: 'event',
  name: 'my-step',
  subscribes: ['my-topic'],
  emits: ['my-output'],
  flows: ['my-flow']
}

export const handler = async (input, ctx) => {
  // Motia will discover and register this step
}
```

</Tab>
<Tab value="Location Issues">

**File outside configured directories**

Steps must be in your configured step directories. By default, this is the `steps/` directory, but if you've customized it using `MOTIA_STEP_DIRS` or `--step-dirs`, steps must be in those directories.

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
❌ **Won't be discovered (default config):**
<Folder name="project-root" defaultOpen>
  <Folder name="src">
    <File name="user-handler.step.ts" />
  </Folder>
  <Folder name="lib">
    <File name="processor.step.py" />
  </Folder>
</Folder>
</div>
<div>
✅ **Will be discovered (default config):**
<Folder name="project-root" defaultOpen>
  <Folder name="steps" defaultOpen>
    <File name="user-handler.step.ts" />
    <File name="processor.step.py" />
  </Folder>
</Folder>
</div>
</div>

**Example with custom directories:**

If you've configured `MOTIA_STEP_DIRS=api-steps,worker-steps`:

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
❌ **Won't be discovered:**
<Folder name="project-root" defaultOpen>
  <Folder name="steps">
    <File name="user-handler.step.ts" />
  </Folder>
  <Folder name="lib">
    <File name="processor.step.py" />
  </Folder>
</Folder>

Error message:
```
Warning: Step file found outside configured directories
File: steps/user-handler.step.ts
Configured directories: api-steps, worker-steps
```
</div>
<div>
✅ **Will be discovered:**
<Folder name="project-root" defaultOpen>
  <Folder name="api-steps" defaultOpen>
    <File name="user-handler.step.ts" />
  </Folder>
  <Folder name="worker-steps" defaultOpen>
    <File name="processor.step.py" />
  </Folder>
</Folder>
</div>
</div>

</Tab>
</Tabs>

### Discovery Verification

Check if your steps are discovered:

```bash
# Run Motia in development mode
motia dev

# Look for discovery logs:
# ✅ Discovered step: user-api (TypeScript)
# ✅ Discovered step: data-processor (Python)  
# ✅ Discovered step: send-notifications (JavaScript)
```

## Next Steps

Now that you understand how Motia discovers and organizes steps:

- Learn about [Core Concepts](/docs/concepts) to understand how steps work together
- Explore [Defining Steps](/docs/concepts/steps/defining-steps) for detailed step creation
- Check out [API Steps](/docs/concepts/steps/api) for creating HTTP endpoints
- Dive into [Event Steps](/docs/concepts/steps/event) for workflow orchestration