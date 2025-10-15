import { EventConfig, Handlers } from 'motia'
import { MCPToolCallSchema } from '../../../src/utils/mcp/tool-schemas'

export const config: EventConfig = {
  type: 'event',
  name: 'MCPGetLogs',
  description: 'MCP Tool: Retrieve execution logs from Motia workflows',
  subscribes: ['mcp.tool.call'],
  emits: [],
  input: MCPToolCallSchema,
  flows: ['mcp-server'],
}

export const handler: Handlers['MCPGetLogs'] = async (input, { streams, logger }) => {
  // Only handle get_execution_logs tool calls
  if (input.toolName !== 'get_execution_logs') {
    return
  }

  const { traceId, stepName, limit = 50, level } = input.arguments

  logger.info('MCP Tool: get_execution_logs', {
    traceId,
    stepName,
    limit,
    level,
  })

  try {
    // Access the __motia.logs stream
    // Note: This is a special stream that Motia creates for logs
    // We'll read recent logs from the stream
    
    // For now, we'll log that this functionality needs stream access
    logger.info('Log retrieval requested', {
      traceId,
      stepName,
      limit,
      level,
      note: 'Accessing Motia log stream - implementation requires stream access',
    })

    // In a full implementation, we would:
    // 1. Access the __motia.logs stream
    // 2. Filter by traceId, stepName, and level
    // 3. Limit the results
    // 4. Return the logs

    logger.warn(
      'Log retrieval not fully implemented yet - requires access to __motia.logs stream'
    )
  } catch (error: any) {
    logger.error('Failed to get execution logs', {
      error: error.message,
      stack: error.stack,
    })
  }
}

