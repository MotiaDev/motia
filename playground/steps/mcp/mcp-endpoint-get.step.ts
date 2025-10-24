import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * MCP GET endpoint
 * Returns 405 Method Not Allowed as we don't support SSE
 * Per MCP spec: servers that don't support server-initiated streaming should return 405
 */
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'MCPEndpointGet',
  description: 'MCP GET endpoint (returns 405 - no SSE support)',
  path: '/mcp',
  method: 'GET',
  emits: [],
  flows: ['mcp-server'],
  responseSchema: {
    405: z.object({
      detail: z.string(),
    }),
  },
}

export const handler: Handlers['MCPEndpointGet'] = async (req, { logger }) => {
  logger.debug('Received GET request to /mcp')

  return {
    status: 405,
    body: {
      detail: 'Method Not Allowed - This server does not support server-initiated streaming (SSE)',
    },
  }
}

