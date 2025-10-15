import { EventConfig, Handlers } from 'motia'
import { MCPToolCallSchema } from '../../../src/utils/mcp/tool-schemas'

export const config: EventConfig = {
  type: 'event',
  name: 'MCPCallApi',
  description: 'MCP Tool: Make HTTP requests to Motia API Step endpoints',
  subscribes: ['mcp.tool.call'],
  emits: [],
  input: MCPToolCallSchema,
  flows: ['mcp-server'],
}

export const handler: Handlers['MCPCallApi'] = async (input, { logger }) => {
  // Only handle call_api tool calls
  if (input.toolName !== 'call_api') {
    return
  }

  const { path, method, body, queryParams } = input.arguments

  logger.info('MCP Tool: call_api', { path, method, body, queryParams })

  try {
    // Build the URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const url = new URL(path, baseUrl)

    // Add query parameters if provided
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    // Make the request
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) }),
    })

    const responseData = await response.json()

    logger.info('API call successful', {
      path,
      method,
      status: response.status,
      response: responseData,
    })
  } catch (error: any) {
    logger.error('Failed to call API', {
      path,
      method,
      error: error.message,
      stack: error.stack,
    })
  }
}

