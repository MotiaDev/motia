import { EventConfig, Handlers } from 'motia'
import { MCPToolCallSchema } from '../../../src/utils/mcp/tool-schemas'
import { motiaIntrospection } from '../../../src/services/mcp/motia-introspection'

export const config: EventConfig = {
  type: 'event',
  name: 'MCPListSteps',
  description: 'MCP Tool: List all Motia steps with configurations and metadata',
  subscribes: ['mcp.tool.call'],
  emits: [],
  input: MCPToolCallSchema,
  flows: ['mcp-server'],
}

export const handler: Handlers['MCPListSteps'] = async (input, { logger }) => {
  // Only handle list_steps tool calls
  if (input.toolName !== 'list_steps') {
    return
  }

  const { type, flow } = input.arguments

  logger.info('MCP Tool: list_steps', { type, flow })

  try {
    let steps = motiaIntrospection.getAllSteps()

    // Filter by type if specified
    if (type) {
      steps = motiaIntrospection.getStepsByType(type)
    }

    // Filter by flow if specified
    if (flow) {
      steps = motiaIntrospection.getStepsInFlow(flow)
    }

    const stepsData = steps.map((step) => ({
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

    logger.info('Listed steps', {
      count: stepsData.length,
      type,
      flow,
      steps: stepsData,
    })
  } catch (error: any) {
    logger.error('Failed to list steps', {
      error: error.message,
      stack: error.stack,
    })
  }
}

