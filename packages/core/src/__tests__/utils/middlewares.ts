import { ApiMiddleware } from '../../types'

export const loggerMiddleware: ApiMiddleware = async (req, ctx, next) => {
  console.log(`[Middleware] Request with body:`, req.body)
  return next()
}

export const authMiddleware = (requiredRole: string): ApiMiddleware => {
  return async (req, ctx, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return {
        status: 401,
        body: { error: 'Authorization header is required' },
      }
    }

    // Simple example - in real world, you'd validate the token
    // and check the user's role against the required role
    if (!authHeader.includes(requiredRole)) {
      return {
        status: 403,
        body: { error: `Required role: ${requiredRole}` },
      }
    }

    return next()
  }
}

export const rateLimitMiddleware = (limit: number, windowMs: number): ApiMiddleware => {
  const requests: Record<string, number[]> = {}

  return async (req, ctx, next) => {
    const ip = req.headers['x-forwarded-for'] || 'unknown-ip'
    const ipStr = Array.isArray(ip) ? ip[0] : ip

    const now = Date.now()
    if (!requests[ipStr]) {
      requests[ipStr] = []
    }

    requests[ipStr] = requests[ipStr].filter((time) => now - time < windowMs)

    if (requests[ipStr].length >= limit) {
      return {
        status: 429,
        body: { error: 'Too many requests, please try again later' },
      }
    }

    requests[ipStr].push(now)
    return next()
  }
}

export const corsMiddleware = (allowedOrigins: string[]): ApiMiddleware => {
  return async (req, ctx, next) => {
    const origin = req.headers.origin

    const response = await next()

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
