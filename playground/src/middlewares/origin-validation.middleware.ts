import { ApiMiddleware } from 'motia'
import { MCPOriginError } from '../errors/mcp.error'

/**
 * Middleware to validate Origin header according to MCP specification.
 * This prevents DNS rebinding attacks by ensuring requests come from trusted origins.
 *
 * Per MCP spec: Servers MUST validate the Origin header on all incoming connections
 * to prevent DNS rebinding attacks.
 */
export const originValidationMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const logger = ctx.logger

  // Get the Origin header (can be string or array of strings)
  const originHeader = req.headers.origin
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader

  logger.debug('Validating origin header', { origin })

  // Validate the origin - allow localhost and 127.0.0.1 on any port
  // Only allow http:// for local development
  if (
    !origin ||
    (!origin.startsWith('http://localhost') && !origin.startsWith('http://127.0.0.1'))
  ) {
    logger.warn('Origin validation failed', { origin })
    throw new MCPOriginError(origin)
  }

  logger.debug('Origin validation passed', { origin })
  return await next()
}

