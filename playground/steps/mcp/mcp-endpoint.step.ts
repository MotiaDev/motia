import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { MCPRequestSchema, MCPMethod, MCPInitializeResult } from '../../src/utils/mcp/types'
import {
  buildMCPSuccessResponse,
  MCPErrorResponses,
} from '../../src/utils/mcp/response-builder'
import { coreMiddleware } from '../../src/middlewares/core.middleware'
import { originValidationMiddleware } from '../../src/middlewares/origin-validation.middleware'
import {
  getTools,
  getResources,
  getPrompts,
  readResource,
  getPrompt,
} from '../../src/services/mcp'

/**
 * Main MCP HTTP endpoint
 * Implements the Model Context Protocol specification
 */
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'MCPEndpoint',
  description: 'Model Context Protocol server endpoint for Motia',
  path: '/mcp',
  method: 'POST',
  emits: ['mcp.tool.call'],
  flows: ['mcp-server'],
  middleware: [originValidationMiddleware, coreMiddleware],
  bodySchema: MCPRequestSchema,
  responseSchema: {
    200: z.object({
      jsonrpc: z.string(),
      id: z.union([z.string(), z.number(), z.null()]),
      result: z.record(z.any()).optional(),
    }),
    202: z.object({}),
    400: z.object({
      jsonrpc: z.string(),
      id: z.union([z.string(), z.number(), z.null()]),
      error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.any().optional(),
      }),
    }),
    500: z.object({
      jsonrpc: z.string(),
      id: z.union([z.string(), z.number(), z.null()]),
      error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.any().optional(),
      }),
    }),
  },
}

export const handler: Handlers['MCPEndpoint'] = async (req, { emit, logger }): Promise<any> => {
  try {
    const mcpRequest = MCPRequestSchema.parse(req.body)

    logger.info('Received MCP request', {
      method: mcpRequest.method,
      id: mcpRequest.id,
    })

    // Handle notifications (requests without id)
    if (mcpRequest.id === null || mcpRequest.id === undefined) {
      logger.debug('Received notification (no response expected)', {
        method: mcpRequest.method,
      })
      return { status: 202 as 202, body: {} }
    }

    // Route based on method
    switch (mcpRequest.method) {
      case MCPMethod.INITIALIZE:
        return handleInitialize(mcpRequest.id, logger)

      case MCPMethod.TOOLS_LIST:
        return handleToolsList(mcpRequest.id, logger)

      case MCPMethod.TOOLS_CALL:
        return await handleToolsCall(mcpRequest.id, mcpRequest.params, emit, logger)

      case MCPMethod.RESOURCES_LIST:
        return handleResourcesList(mcpRequest.id, logger)

      case MCPMethod.RESOURCES_READ:
        return await handleResourcesRead(mcpRequest.id, mcpRequest.params, logger)

      case MCPMethod.PROMPTS_LIST:
        return handlePromptsList(mcpRequest.id, logger)

      case MCPMethod.PROMPTS_GET:
        return handlePromptsGet(mcpRequest.id, mcpRequest.params, logger)

      default:
        logger.warn('Unknown MCP method', { method: mcpRequest.method })
        return {
          status: 400 as 400,
          body: MCPErrorResponses.methodNotFound(mcpRequest.id, mcpRequest.method),
        }
    }
  } catch (error: any) {
    logger.error('Error handling MCP request', {
      error: error.message,
      stack: error.stack,
    })

    return {
      status: 500 as 500,
      body: MCPErrorResponses.internalError(null, error.message),
    }
  }
}

/**
 * Handle initialize request
 * Returns server capabilities and info
 */
function handleInitialize(id: string | number | null, logger: any) {
  logger.info('Handling initialize request')

  const result: MCPInitializeResult = {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {
        listChanged: false,
      },
      resources: {
        subscribe: false,
        listChanged: false,
      },
      prompts: {
        listChanged: false,
      },
    },
    serverInfo: {
      name: 'motia-mcp-server',
      version: '1.0.0',
    },
  }

  return {
    status: 200 as 200,
    body: buildMCPSuccessResponse(id, result),
  }
}

/**
 * Handle tools/list request
 * Returns all available tools
 */
function handleToolsList(id: string | number | null, logger: any) {
  logger.info('Handling tools/list request')

  const tools = getTools()

  return {
    status: 200 as 200,
    body: buildMCPSuccessResponse(id, { tools }),
  }
}

/**
 * Handle tools/call request
 * Emits event to appropriate tool handler
 */
async function handleToolsCall(
  id: string | number | null,
  params: any,
  emit: any,
  logger: any
) {
  logger.info('Handling tools/call request', { toolName: params?.name })

  if (!params?.name) {
    return {
      status: 400 as 400,
      body: MCPErrorResponses.invalidParams(id, 'Tool name is required'),
    }
  }

  const toolName = params.name
  const toolArguments = params.arguments || {}

  // Emit event to tool handler
  // The tool handler Event Steps will process this and return results
  await emit({
    topic: 'mcp.tool.call',
    data: {
      toolName,
      arguments: toolArguments,
      requestId: id,
    },
  })

  // For now, return a simple acknowledgment
  // In a real implementation, we'd wait for the tool execution to complete
  return {
    status: 200 as 200,
    body: buildMCPSuccessResponse(id, {
      content: [
        {
          type: 'text',
          text: `Tool ${toolName} execution started. Check logs for results.`,
        },
      ],
    }),
  }
}

/**
 * Handle resources/list request
 * Returns all available resources
 */
function handleResourcesList(id: string | number | null, logger: any) {
  logger.info('Handling resources/list request')

  const resources = getResources()

  return {
    status: 200 as 200,
    body: buildMCPSuccessResponse(id, { resources }),
  }
}

/**
 * Handle resources/read request
 * Returns the contents of a resource
 */
async function handleResourcesRead(id: string | number | null, params: any, logger: any) {
  logger.info('Handling resources/read request', { uri: params?.uri })

  if (!params?.uri) {
    return {
      status: 400 as 400,
      body: MCPErrorResponses.invalidParams(id, 'Resource URI is required'),
    }
  }

  try {
    const resource = await readResource(params.uri)

    return {
      status: 200 as 200,
      body: buildMCPSuccessResponse(id, {
        contents: [resource],
      }),
    }
  } catch (error: any) {
    logger.error('Failed to read resource', {
      uri: params.uri,
      error: error.message,
    })

    return {
      status: 500 as 500,
      body: MCPErrorResponses.internalError(id, error.message),
    }
  }
}

/**
 * Handle prompts/list request
 * Returns all available prompts
 */
function handlePromptsList(id: string | number | null, logger: any) {
  logger.info('Handling prompts/list request')

  const prompts = getPrompts()

  return {
    status: 200 as 200,
    body: buildMCPSuccessResponse(id, { prompts }),
  }
}

/**
 * Handle prompts/get request
 * Returns a prompt template with the given arguments
 */
function handlePromptsGet(id: string | number | null, params: any, logger: any) {
  logger.info('Handling prompts/get request', { promptName: params?.name })

  if (!params?.name) {
    return {
      status: 400 as 400,
      body: MCPErrorResponses.invalidParams(id, 'Prompt name is required'),
    }
  }

  try {
    const prompt = getPrompt(params.name, params.arguments)

    return {
      status: 200 as 200,
      body: buildMCPSuccessResponse(id, prompt),
    }
  } catch (error: any) {
    logger.error('Failed to get prompt', {
      promptName: params.name,
      error: error.message,
    })

    return {
      status: 500 as 500,
      body: MCPErrorResponses.internalError(id, error.message),
    }
  }
}

