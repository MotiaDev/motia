import { MCPTool } from '../../utils/mcp/types'

/**
 * Get all available MCP tools
 */
export function getTools(): MCPTool[] {
  return [
    {
      name: 'trigger_workflow',
      description:
        'Emit an event to trigger Event Steps in the Motia workflow. Use this to start background processing tasks.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic/event name to emit to (must match a subscribes value in Event Steps)',
          },
          data: {
            type: 'object',
            description: 'The data payload to send with the event',
          },
        },
        required: ['topic', 'data'],
      },
    },
    {
      name: 'call_api',
      description:
        'Make an HTTP request to a Motia API Step endpoint. Use this to trigger API workflows programmatically.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The API endpoint path (e.g., /users, /messages)',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'The HTTP method',
          },
          body: {
            type: 'object',
            description: 'The request body (for POST, PUT, PATCH)',
          },
          queryParams: {
            type: 'object',
            description: 'Query parameters as key-value pairs',
          },
        },
        required: ['path', 'method'],
      },
    },
    {
      name: 'get_execution_logs',
      description:
        'Retrieve execution logs from Motia workflows. Useful for debugging and monitoring.',
      inputSchema: {
        type: 'object',
        properties: {
          traceId: {
            type: 'string',
            description: 'The trace ID to filter logs by (optional)',
          },
          stepName: {
            type: 'string',
            description: 'The step name to filter logs by (optional)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of log entries to return (default: 50)',
          },
          level: {
            type: 'string',
            enum: ['info', 'error', 'debug', 'warn'],
            description: 'Filter by log level (optional)',
          },
        },
      },
    },
    {
      name: 'manage_state',
      description:
        'Get or set state values in Motia state management. State is persisted across workflow executions.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['get', 'set', 'delete', 'getGroup', 'clear'],
            description: 'The state operation to perform',
          },
          namespace: {
            type: 'string',
            description: 'The state namespace/group (e.g., "users", "orders")',
          },
          key: {
            type: 'string',
            description: 'The state key (required for get, set, delete)',
          },
          value: {
            type: 'object',
            description: 'The value to set (required for set operation)',
          },
        },
        required: ['operation', 'namespace'],
      },
    },
    {
      name: 'list_steps',
      description:
        'List all Motia steps in the current application with their configurations and metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['api', 'event', 'cron', 'noop'],
            description: 'Filter by step type (optional)',
          },
          flow: {
            type: 'string',
            description: 'Filter by flow name (optional)',
          },
        },
      },
    },
  ]
}

/**
 * Get a specific tool by name
 */
export function getToolByName(name: string): MCPTool | undefined {
  return getTools().find((tool) => tool.name === name)
}

