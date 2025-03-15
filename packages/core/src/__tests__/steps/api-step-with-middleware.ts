import { ApiRequest, ApiResponse, ApiRouteConfig, ApiRouteHandler, FlowContext, ApiMiddleware } from '../../types'

const loggerMiddleware: ApiMiddleware = async (req, ctx, next) => {
  ctx.logger.info(`[Middleware] Request with body:`, req.body)
  return next()
}

const corsMiddleware = (allowedOrigins: string[]): ApiMiddleware => {
  return async (req, ctx, next) => {
    const origin = req.headers.origin

    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin as string))) {
      ctx.logger.debug(`[CORS] Allowing origin: ${origin}`)
      req.headers['x-cors-origin'] = origin
      req.headers['x-cors-allowed'] = 'true'
    }

    const response = await next()

    // Add CORS headers to response
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin as string))) {
      response.headers = {
        ...response.headers,
        'Access-Control-Allow-Origin': Array.isArray(origin) ? origin[0] : origin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      }
    }

    return response
  }
}

const jsonValidatorMiddleware: ApiMiddleware = async (req, ctx, next) => {
  try {
    if (typeof req.body === 'string') {
      req.body = JSON.parse(req.body)
    }
    return next()
  } catch (error) {
    ctx.logger.error('Invalid JSON in request body')
    return {
      status: 400,
      body: { error: 'Invalid JSON format' },
    }
  }
}

const rateLimiterMiddleware: ApiMiddleware = (() => {
  const requests: Record<string, number[]> = {}
  const limit = 100
  const windowMs = 60000 // 1 minute

  return async (req, ctx, next) => {
    const ip = req.headers['x-forwarded-for'] || 'unknown-ip'
    const ipStr = Array.isArray(ip) ? ip[0] : ip

    const now = Date.now()
    if (!requests[ipStr]) {
      requests[ipStr] = []
    }

    // Remove old requests outside the time window
    requests[ipStr] = requests[ipStr].filter((time) => now - time < windowMs)

    if (requests[ipStr].length >= limit) {
      ctx.logger.warn(`[Rate Limit] Too many requests from IP: ${ipStr}`)
      return {
        status: 429,
        body: { error: 'Too many requests, please try again later' },
      }
    }

    // Add current request
    requests[ipStr].push(now)
    ctx.logger.info(`Request from IP: ${ipStr}`)

    return next()
  }
})()

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'api-with-middleware',
  emits: ['TEST_EVENT'],
  path: '/test-middleware',
  method: 'POST',
  middleware: [loggerMiddleware, corsMiddleware(['*']), jsonValidatorMiddleware, rateLimiterMiddleware],
}

export const handler: ApiRouteHandler = async (req: ApiRequest, ctx: FlowContext): Promise<ApiResponse> => {
  ctx.logger.info('Processing api-with-middleware', req)

  return {
    status: 200,
    body: {
      message: 'Success',
      receivedData: req.body,
    },
  }
}
