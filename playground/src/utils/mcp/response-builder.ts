import { MCPResponse, MCPError } from './types'

/**
 * Build a successful MCP response
 */
export function buildMCPSuccessResponse<T>(id: string | number | null, result: T): MCPResponse<T> {
  return {
    jsonrpc: '2.0',
    id,
    result,
  }
}

/**
 * Build an MCP error response
 */
export function buildMCPErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): MCPResponse {
  const error: MCPError = {
    code,
    message,
  }

  if (data !== undefined) {
    error.data = data
  }

  return {
    jsonrpc: '2.0',
    id,
    error,
  }
}

/**
 * Standard JSON-RPC error codes
 */
export enum JSONRPCErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
}

/**
 * Build common error responses
 */
export const MCPErrorResponses = {
  parseError: (id: string | number | null) =>
    buildMCPErrorResponse(id, JSONRPCErrorCode.PARSE_ERROR, 'Parse error'),

  invalidRequest: (id: string | number | null, details?: string) =>
    buildMCPErrorResponse(
      id,
      JSONRPCErrorCode.INVALID_REQUEST,
      'Invalid Request',
      details ? { details } : undefined
    ),

  methodNotFound: (id: string | number | null, method: string) =>
    buildMCPErrorResponse(id, JSONRPCErrorCode.METHOD_NOT_FOUND, `Method not found: ${method}`),

  invalidParams: (id: string | number | null, details?: string) =>
    buildMCPErrorResponse(
      id,
      JSONRPCErrorCode.INVALID_PARAMS,
      'Invalid params',
      details ? { details } : undefined
    ),

  internalError: (id: string | number | null, details?: string) =>
    buildMCPErrorResponse(
      id,
      JSONRPCErrorCode.INTERNAL_ERROR,
      'Internal error',
      details ? { details } : undefined
    ),
}

