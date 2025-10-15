import { BaseError } from './base.error'

/**
 * Error thrown when MCP origin validation fails
 */
export class MCPOriginError extends BaseError {
  constructor(origin: string | undefined) {
    super(
      `Origin '${origin}' is not allowed. Only localhost and 127.0.0.1 are permitted.`,
      403,
      'MCP_ORIGIN_NOT_ALLOWED',
      { origin }
    )
  }
}

/**
 * Error thrown when MCP method is not found
 */
export class MCPMethodNotFoundError extends BaseError {
  constructor(method: string) {
    super(`MCP method '${method}' is not supported`, 400, 'MCP_METHOD_NOT_FOUND', { method })
  }
}

/**
 * Error thrown when MCP tool is not found
 */
export class MCPToolNotFoundError extends BaseError {
  constructor(toolName: string) {
    super(`MCP tool '${toolName}' does not exist`, 404, 'MCP_TOOL_NOT_FOUND', { toolName })
  }
}

/**
 * Error thrown when MCP resource is not found
 */
export class MCPResourceNotFoundError extends BaseError {
  constructor(uri: string) {
    super(`MCP resource '${uri}' does not exist`, 404, 'MCP_RESOURCE_NOT_FOUND', { uri })
  }
}

/**
 * Error thrown when MCP prompt is not found
 */
export class MCPPromptNotFoundError extends BaseError {
  constructor(promptName: string) {
    super(`MCP prompt '${promptName}' does not exist`, 404, 'MCP_PROMPT_NOT_FOUND', { promptName })
  }
}

/**
 * Error thrown when MCP request is invalid
 */
export class MCPInvalidRequestError extends BaseError {
  constructor(details: string) {
    super(`Invalid MCP request: ${details}`, 400, 'MCP_INVALID_REQUEST', { details })
  }
}

