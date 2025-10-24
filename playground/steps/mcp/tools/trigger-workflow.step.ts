import { EventConfig, Handlers } from 'motia'
import { MCPToolCallSchema } from '../../../src/utils/mcp/tool-schemas'
import { motiaIntrospection } from '../../../src/services/mcp/motia-introspection'

export const config: EventConfig = {
  type: 'event',
  name: 'MCPTriggerWorkflow',
  description: 'MCP Tool: Emit events to trigger Motia Event Steps',
  subscribes: ['mcp.tool.call'],
  emits: [],
  input: MCPToolCallSchema,
  flows: ['mcp-server'],
}

export const handler: Handlers['MCPTriggerWorkflow'] = async (input, { emit, logger }) => {
  // Only handle trigger_workflow tool calls
  if (input.toolName !== 'trigger_workflow') {
    return
  }

  const topic = input.arguments.topic as string
  const data = input.arguments.data

  logger.info('MCP Tool: trigger_workflow', { topic, data })

  // Validate that the topic exists
  const topicExists = motiaIntrospection.topicExists(topic)

  if (!topicExists) {
    logger.error('Topic does not exist', { topic })
    // In a real implementation, we'd return an error to the MCP client
    return
  }

  try {
    // Emit the event to the specified topic
    // @ts-ignore - Dynamic topic emission
    await emit({
      topic: topic,
      data: data,
    })

    logger.info('Successfully triggered workflow', {
      topic,
      success: true,
    })
  } catch (error: any) {
    logger.error('Failed to trigger workflow', {
      topic,
      error: error.message,
      stack: error.stack,
    })
  }
}

