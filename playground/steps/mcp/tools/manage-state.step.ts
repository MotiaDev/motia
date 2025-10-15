import { EventConfig, Handlers } from 'motia'
import { MCPToolCallSchema } from '../../../src/utils/mcp/tool-schemas'

export const config: EventConfig = {
  type: 'event',
  name: 'MCPManageState',
  description: 'MCP Tool: Get or set state values in Motia state management',
  subscribes: ['mcp.tool.call'],
  emits: [],
  input: MCPToolCallSchema,
  flows: ['mcp-server'],
}

export const handler: Handlers['MCPManageState'] = async (input, { state, logger }) => {
  // Only handle manage_state tool calls
  if (input.toolName !== 'manage_state') {
    return
  }

  const operation = input.arguments.operation as string
  const namespace = input.arguments.namespace as string
  const key = input.arguments.key as string | undefined
  const value = input.arguments.value

  logger.info('MCP Tool: manage_state', { operation, namespace, key })

  try {
    switch (operation) {
      case 'get':
        if (!key) {
          logger.error('Key is required for get operation')
          return
        }
        const getValue = await state.get(namespace, key!)
        logger.info('State get result', { namespace, key, value: getValue })
        break

      case 'set':
        if (!key) {
          logger.error('Key is required for set operation')
          return
        }
        if (value === undefined) {
          logger.error('Value is required for set operation')
          return
        }
        await state.set(namespace, key!, value)
        logger.info('State set successfully', { namespace, key })
        break

      case 'delete':
        if (!key) {
          logger.error('Key is required for delete operation')
          return
        }
        await state.delete(namespace, key!)
        logger.info('State deleted successfully', { namespace, key })
        break

      case 'getGroup':
        const group = await state.getGroup(namespace)
        logger.info('State getGroup result', {
          namespace,
          count: group.length,
        })
        break

      case 'clear':
        await state.clear(namespace)
        logger.info('State cleared successfully', { namespace })
        break

      default:
        logger.error('Unknown state operation', { operation })
    }
  } catch (error: any) {
    logger.error('Failed to manage state', {
      operation,
      namespace,
      key,
      error: error.message,
      stack: error.stack,
    })
  }
}

