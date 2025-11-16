import { MCPPrompt, PromptGetResult } from '../../utils/mcp/types'

/**
 * Get all available MCP prompts
 */
export function getPrompts(): MCPPrompt[] {
  return [
    {
      name: 'create_api_step',
      description: 'Generate a complete Motia API Step with proper configuration and handler',
      arguments: [
        {
          name: 'name',
          description: 'The step name (PascalCase, e.g., CreateUser)',
          required: true,
        },
        {
          name: 'path',
          description: 'The HTTP endpoint path (e.g., /users, /messages/:id)',
          required: true,
        },
        {
          name: 'method',
          description: 'The HTTP method (GET, POST, PUT, DELETE, PATCH)',
          required: true,
        },
        {
          name: 'language',
          description: 'Programming language (typescript or python)',
          required: false,
        },
        {
          name: 'description',
          description: 'A brief description of what this endpoint does',
          required: false,
        },
      ],
    },
    {
      name: 'create_event_step',
      description: 'Generate a complete Motia Event Step for background processing',
      arguments: [
        {
          name: 'name',
          description: 'The step name (PascalCase, e.g., SendEmail)',
          required: true,
        },
        {
          name: 'subscribes',
          description: 'Comma-separated list of topics to subscribe to (e.g., user.created,order.placed)',
          required: true,
        },
        {
          name: 'language',
          description: 'Programming language (typescript or python)',
          required: false,
        },
        {
          name: 'description',
          description: 'A brief description of what this step processes',
          required: false,
        },
      ],
    },
    {
      name: 'create_cron_step',
      description: 'Generate a complete Motia Cron Step for scheduled tasks',
      arguments: [
        {
          name: 'name',
          description: 'The step name (PascalCase, e.g., DailyReportJob)',
          required: true,
        },
        {
          name: 'schedule',
          description: 'Cron expression (e.g., "0 9 * * *" for daily at 9 AM)',
          required: true,
        },
        {
          name: 'language',
          description: 'Programming language (typescript or python)',
          required: false,
        },
        {
          name: 'description',
          description: 'A brief description of what this scheduled task does',
          required: false,
        },
      ],
    },
    {
      name: 'debug_workflow',
      description: 'Get debugging guidance for Motia workflow issues',
      arguments: [
        {
          name: 'issue',
          description: 'Describe the issue you are experiencing',
          required: true,
        },
        {
          name: 'stepName',
          description: 'The step name where the issue occurs (optional)',
          required: false,
        },
        {
          name: 'traceId',
          description: 'The trace ID of the execution (optional)',
          required: false,
        },
      ],
    },
    {
      name: 'optimize_architecture',
      description: 'Get architectural recommendations for your Motia application',
      arguments: [
        {
          name: 'description',
          description: 'Describe your application or workflow',
          required: true,
        },
        {
          name: 'concerns',
          description: 'Specific concerns or requirements (optional)',
          required: false,
        },
      ],
    },
  ]
}

/**
 * Get a prompt template by name
 */
export function getPrompt(name: string, args?: Record<string, string>): PromptGetResult {
  switch (name) {
    case 'create_api_step':
      return generateApiStepPrompt(args)
    case 'create_event_step':
      return generateEventStepPrompt(args)
    case 'create_cron_step':
      return generateCronStepPrompt(args)
    case 'debug_workflow':
      return generateDebugWorkflowPrompt(args)
    case 'optimize_architecture':
      return generateOptimizeArchitecturePrompt(args)
    default:
      throw new Error(`Unknown prompt: ${name}`)
  }
}

function generateApiStepPrompt(args?: Record<string, string>): PromptGetResult {
  const name = args?.name || 'MyApiStep'
  const path = args?.path || '/example'
  const method = args?.method || 'POST'
  const language = args?.language || 'typescript'
  const description = args?.description || 'API endpoint'

  const isTypeScript = language === 'typescript'

  const content = isTypeScript
    ? `Create a Motia API Step with the following requirements:

**Step Name:** ${name}
**Endpoint Path:** ${path}
**HTTP Method:** ${method}
**Description:** ${description}
**Language:** TypeScript

Please generate:
1. File named: ${name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}.step.ts
2. Complete config with ApiRouteConfig type
3. Proper Zod schemas for request body and response
4. Handler with type-safe implementation using Handlers['${name}']
5. Follow Domain-Driven Design - use services for business logic
6. Include proper error handling
7. Add core middleware for error handling
8. Use logger for structured logging
9. Document when to use emit() vs direct processing

Reference the motia://docs/api-steps resource for complete examples and patterns.`
    : `Create a Motia API Step with the following requirements:

**Step Name:** ${name}
**Endpoint Path:** ${path}
**HTTP Method:** ${method}
**Description:** ${description}
**Language:** Python

Please generate:
1. File named: ${name.toLowerCase()}_step.py (snake_case with _step suffix)
2. Complete config dictionary with all required fields
3. Pydantic models for request body validation
4. Handler function with proper type hints
5. Follow Domain-Driven Design - use services for business logic
6. Include proper error handling
7. Use context.logger for structured logging
8. Document when to use emit() vs direct processing

Reference the motia://docs/api-steps resource for complete examples and patterns.`

  return {
    description: `Template for creating a Motia API Step in ${language}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  }
}

function generateEventStepPrompt(args?: Record<string, string>): PromptGetResult {
  const name = args?.name || 'MyEventStep'
  const subscribes = args?.subscribes || 'example.topic'
  const language = args?.language || 'typescript'
  const description = args?.description || 'Event handler'

  const topics = subscribes.split(',').map((t) => t.trim())
  const isTypeScript = language === 'typescript'

  const content = isTypeScript
    ? `Create a Motia Event Step with the following requirements:

**Step Name:** ${name}
**Subscribes To:** ${topics.join(', ')}
**Description:** ${description}
**Language:** TypeScript

Please generate:
1. File named: ${name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}.step.ts
2. Complete config with EventConfig type
3. Proper Zod schema for input validation
4. Handler with type-safe implementation using Handlers['${name}']
5. Follow Domain-Driven Design - use services for business logic
6. Include proper error handling with try-catch
7. Use logger for structured logging
8. Document the input schema clearly

Event Steps are for:
- LLM calls
- Processing large files (images, videos, audio)
- Sending emails
- Webhook calls to external systems
- Any task that can fail and needs retry logic

Reference the motia://docs/event-steps resource for complete examples and patterns.`
    : `Create a Motia Event Step with the following requirements:

**Step Name:** ${name}
**Subscribes To:** ${topics.join(', ')}
**Description:** ${description}
**Language:** Python

Please generate:
1. File named: ${name.toLowerCase()}_step.py (snake_case with _step suffix)
2. Complete config dictionary with all required fields
3. Pydantic model for input validation (optional but recommended)
4. Handler function with proper type hints
5. Follow Domain-Driven Design - use services for business logic
6. Include proper error handling with try-except
7. Use context.logger for structured logging
8. Document the input schema clearly

Event Steps are for:
- LLM calls
- Processing large files (images, videos, audio)
- Sending emails
- Webhook calls to external systems
- Any task that can fail and needs retry logic

Reference the motia://docs/event-steps resource for complete examples and patterns.`

  return {
    description: `Template for creating a Motia Event Step in ${language}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  }
}

function generateCronStepPrompt(args?: Record<string, string>): PromptGetResult {
  const name = args?.name || 'MyCronJob'
  const schedule = args?.schedule || '0 9 * * *'
  const language = args?.language || 'typescript'
  const description = args?.description || 'Scheduled task'

  const isTypeScript = language === 'typescript'

  const content = isTypeScript
    ? `Create a Motia Cron Step with the following requirements:

**Step Name:** ${name}
**Cron Schedule:** ${schedule}
**Description:** ${description}
**Language:** TypeScript

Please generate:
1. File named: ${name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}.step.ts
2. Complete config with CronConfig type
3. Handler with type-safe implementation using Handlers['${name}']
4. Follow Domain-Driven Design - use services for business logic
5. Include proper error handling
6. Use logger for structured logging
7. Consider idempotent patterns
8. Document when to emit events vs process directly

IMPORTANT: Cron Steps do NOT have retry mechanisms. If the logic is likely to fail:
- Use the Cron Step to emit an event
- Let an Event Step handle the actual logic

Reference the motia://docs/cron-steps resource for complete examples and patterns.`
    : `Create a Motia Cron Step with the following requirements:

**Step Name:** ${name}
**Cron Schedule:** ${schedule}
**Description:** ${description}
**Language:** Python

Please generate:
1. File named: ${name.toLowerCase()}_step.py (snake_case with _step suffix)
2. Complete config dictionary with all required fields
3. Handler function with proper type hints
4. Follow Domain-Driven Design - use services for business logic
5. Include proper error handling
6. Use context.logger for structured logging
7. Consider idempotent patterns
8. Document when to emit events vs process directly

IMPORTANT: Cron Steps do NOT have retry mechanisms. If the logic is likely to fail:
- Use the Cron Step to emit an event
- Let an Event Step handle the actual logic

Reference the motia://docs/cron-steps resource for complete examples and patterns.`

  return {
    description: `Template for creating a Motia Cron Step in ${language}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  }
}

function generateDebugWorkflowPrompt(args?: Record<string, string>): PromptGetResult {
  const issue = args?.issue || 'Describe your issue here'
  const stepName = args?.stepName || 'Not specified'
  const traceId = args?.traceId || 'Not specified'

  const content = `Help debug a Motia workflow issue:

**Issue:** ${issue}
**Step Name:** ${stepName}
**Trace ID:** ${traceId}

Please provide debugging guidance covering:

1. **Common Issues Checklist:**
   - Is the step file named correctly? (.step.ts for TS, _step.py for Python)
   - Is the step in the steps/ directory?
   - Does the config export both 'config' and 'handler'?
   - Are all emits listed in the config before using them?
   - For Event Steps: Does the subscribe topic match an emit topic?
   - For API Steps: Is the path correct and not conflicting?

2. **Log Analysis:**
   - Use the get_execution_logs tool with the trace ID
   - Look for error messages and stack traces
   - Check for validation errors (ZodError or Pydantic ValidationError)
   - Verify the step execution sequence

3. **State Inspection:**
   - Use the manage_state tool to check state values
   - Verify data is being stored/retrieved correctly
   - Check namespace and key names match

4. **Type Generation:**
   - Run: npx motia generate-types
   - Ensure TypeScript types are up to date
   - Check Handlers type includes your step name

5. **Workbench Visualization:**
   - Check if the step appears in Workbench
   - Verify connections between steps
   - Look for broken or missing links

6. **Common Fixes:**
   - Restart the dev server (npx motia dev)
   - Clear .motia directory
   - Check for syntax errors in step files
   - Verify middleware is applied correctly

Reference the motia://docs/error-handling resource for best practices.`

  return {
    description: 'Debugging guidance for Motia workflows',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  }
}

function generateOptimizeArchitecturePrompt(args?: Record<string, string>): PromptGetResult {
  const description = args?.description || 'Describe your application'
  const concerns = args?.concerns || 'General optimization'

  const content = `Provide architectural recommendations for a Motia application:

**Application Description:** ${description}
**Specific Concerns:** ${concerns}

Please analyze and provide recommendations for:

1. **Step Type Selection:**
   - When to use API Steps vs Event Steps
   - When to use Cron Steps vs Event Steps
   - When to use NOOP Steps for visualization

   **Guidelines:**
   - API Steps: Synchronous HTTP requests, quick responses
   - Event Steps: Async work, LLM calls, email, file processing, external webhooks
   - Cron Steps: Scheduled tasks; emit to Event Steps if likely to fail

2. **State Management Strategy:**
   - When to use Motia state vs external database
   - Caching strategies and TTL configuration
   - State namespace organization

   **Use Motia State For:**
   - Temporary data between steps
   - Caching API responses
   - Session data
   
   **Use Database For:**
   - Persistent user data
   - Large datasets
   - Complex queries

3. **Flow Organization:**
   - How to group steps into flows
   - Using virtualEmits/virtualSubscribes for documentation
   - Organizing steps in directories

4. **Error Handling:**
   - Middleware setup for API Steps
   - Error handling in Event Steps
   - Custom error classes

5. **Performance:**
   - When to emit events vs process directly
   - State vs streams for real-time data
   - Optimizing step execution chains

6. **Domain-Driven Design:**
   - Organizing services and repositories
   - Separation of concerns
   - Where to put business logic

Reference these resources:
- motia://docs/architecture
- motia://docs/state-management
- motia://docs/error-handling`

  return {
    description: 'Architectural recommendations for Motia applications',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: content,
        },
      },
    ],
  }
}

/**
 * Get a prompt definition by name
 */
export function getPromptByName(name: string): MCPPrompt | undefined {
  return getPrompts().find((prompt) => prompt.name === name)
}

