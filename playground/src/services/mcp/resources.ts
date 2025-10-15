import { MCPResource, ResourceContents } from '../../utils/mcp/types'
import { motiaIntrospection } from './motia-introspection'

/**
 * Get all available MCP resources
 */
export function getResources(): MCPResource[] {
  return [
    {
      uri: 'motia://steps',
      name: 'All Motia Steps',
      description: 'List all steps in the current Motia application with their configurations',
      mimeType: 'application/json',
    },
    {
      uri: 'motia://flows',
      name: 'All Motia Flows',
      description: 'List all flows and their associated steps',
      mimeType: 'application/json',
    },
    {
      uri: 'motia://topics',
      name: 'All Event Topics',
      description: 'List all event topics (emits and subscribes) in the application',
      mimeType: 'application/json',
    },
    {
      uri: 'motia://api-endpoints',
      name: 'All API Endpoints',
      description: 'List all HTTP API endpoints with their paths and methods',
      mimeType: 'application/json',
    },
    {
      uri: 'motia://docs/quick-start',
      name: 'Motia Quick Start Guide',
      description: 'Quick reference for creating Motia steps',
      mimeType: 'text/markdown',
    },
  ]
}

/**
 * Read a resource by URI
 */
export async function readResource(uri: string): Promise<ResourceContents> {
  // Handle different resource types
  if (uri === 'motia://steps') {
    return readStepsResource()
  }

  if (uri === 'motia://flows') {
    return readFlowsResource()
  }

  if (uri === 'motia://topics') {
    return readTopicsResource()
  }

  if (uri === 'motia://api-endpoints') {
    return readApiEndpointsResource()
  }

  if (uri === 'motia://docs/quick-start') {
    return readQuickStartResource()
  }

  throw new Error(`Resource not found: ${uri}`)
}

function readStepsResource(): ResourceContents {
  const allSteps = motiaIntrospection.getAllSteps()

  const stepsData = allSteps.map((step) => ({
    name: step.config.name,
    type: step.config.type,
    filePath: step.filePath,
    description: (step.config as any).description,
    flows: (step.config as any).flows || [],
    ...(step.config.type === 'api' && {
      path: (step.config as any).path,
      method: (step.config as any).method,
    }),
    ...(step.config.type === 'event' && {
      subscribes: (step.config as any).subscribes,
    }),
    ...(step.config.type === 'cron' && {
      cron: (step.config as any).cron,
    }),
  }))

  return {
    uri: 'motia://steps',
    mimeType: 'application/json',
    text: JSON.stringify(stepsData, null, 2),
  }
}

function readFlowsResource(): ResourceContents {
  const flows = motiaIntrospection.getFlows()

  const flowsData = Object.entries(flows).map(([name, flow]) => ({
    name,
    steps: flow.steps.map((step) => ({
      name: step.config.name,
      type: step.config.type,
    })),
  }))

  return {
    uri: 'motia://flows',
    mimeType: 'application/json',
    text: JSON.stringify(flowsData, null, 2),
  }
}

function readTopicsResource(): ResourceContents {
  const topics = motiaIntrospection.getAllTopics()

  return {
    uri: 'motia://topics',
    mimeType: 'application/json',
    text: JSON.stringify({ topics }, null, 2),
  }
}

function readApiEndpointsResource(): ResourceContents {
  const endpoints = motiaIntrospection.getApiEndpoints()

  return {
    uri: 'motia://api-endpoints',
    mimeType: 'application/json',
    text: JSON.stringify(endpoints, null, 2),
  }
}

function readQuickStartResource(): ResourceContents {
  const content = `# Motia Quick Start Guide

## Step Naming Conventions

### TypeScript/JavaScript
- Use kebab-case: \`my-step.step.ts\` or \`my-step.step.js\`
- Must include \`.step\` before the extension

### Python
- Use snake_case: \`my_step_step.py\`
- Must include \`_step\` before the extension

## API Steps (HTTP Endpoints)

\`\`\`typescript
// create-user.step.ts
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateUser',
  path: '/users',
  method: 'POST',
  bodySchema,
  emits: ['user.created'],
  responseSchema: {
    201: z.object({ id: z.string(), name: z.string() })
  }
}

export const handler: Handlers['CreateUser'] = async (req, { emit, logger }) => {
  const { name, email } = bodySchema.parse(req.body)
  
  logger.info('Creating user', { name, email })
  
  const user = { id: '123', name, email }
  
  await emit({ topic: 'user.created', data: user })
  
  return { status: 201, body: { id: user.id, name: user.name } }
}
\`\`\`

## Event Steps (Background Processing)

\`\`\`typescript
// send-welcome-email.step.ts
import { EventConfig, Handlers } from 'motia'
import { z } from 'zod'

const inputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

export const config: EventConfig = {
  type: 'event',
  name: 'SendWelcomeEmail',
  subscribes: ['user.created'],
  emits: [],
  input: inputSchema,
}

export const handler: Handlers['SendWelcomeEmail'] = async (input, { logger }) => {
  logger.info('Sending welcome email', { email: input.email })
  
  // Send email logic here
  
  logger.info('Welcome email sent', { email: input.email })
}
\`\`\`

## Cron Steps (Scheduled Tasks)

\`\`\`typescript
// daily-report.step.ts
import { CronConfig, Handlers } from 'motia'

export const config: CronConfig = {
  type: 'cron',
  name: 'DailyReport',
  cron: '0 9 * * *', // Every day at 9 AM
  emits: ['report.generated'],
}

export const handler: Handlers['DailyReport'] = async ({ emit, logger }) => {
  logger.info('Generating daily report')
  
  // Generate report logic
  
  await emit({ topic: 'report.generated', data: { date: new Date() } })
}
\`\`\`

## Key Concepts

### When to Use Each Step Type
- **API Steps**: Synchronous HTTP requests, quick responses
- **Event Steps**: Async work, LLM calls, emails, file processing, external webhooks
- **Cron Steps**: Scheduled tasks; emit to Event Steps if likely to fail

### State Management
\`\`\`typescript
// Store data
await state.set('users', userId, userData)

// Retrieve data
const user = await state.get('users', userId)

// Get all items in a namespace
const allUsers = await state.getGroup('users')
\`\`\`

### Emit Events
\`\`\`typescript
await emit({
  topic: 'user.created', // Must be in config.emits
  data: { id, name, email }
})
\`\`\`

## Generate Types After Changes

\`\`\`bash
npx motia generate-types
\`\`\`

## Documentation
Visit https://motia.dev/docs for complete documentation.
`

  return {
    uri: 'motia://docs/quick-start',
    mimeType: 'text/markdown',
    text: content,
  }
}

/**
 * Get a resource by URI
 */
export function getResourceByUri(uri: string): MCPResource | undefined {
  return getResources().find((resource) => resource.uri === uri)
}

