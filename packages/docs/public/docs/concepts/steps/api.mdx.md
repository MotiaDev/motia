---
title: API Step
---

An **API step** is exposed as an HTTP endpoint that acts as an entry point into your sequence of steps, or **flow**. It allows external systems or clients to trigger and interact with your flows through a REST API interface. Like any Motia Step, an API Step can be configured to emit events or wait for events to occur.

## Config

The following properties are specific to the API Step, in addition to the [common step config](/docs/concepts/steps/defining-steps#config).

<DescriptionTable
  type={{
    path: {
      description: 'The HTTP path for the API endpoint',
      type: 'string',
    },
    method: {
      description: 'The HTTP method for the API endpoint (GET, POST, PUT, DELETE, etc.)',
      type: 'string',
    },
    bodySchema: {
      description:
        'Schema for validating the request body. For TypeScript/JavaScript steps, it uses zod schemas. For Python steps, it uses Pydantic models.',
      type: 'object',
    },
    middleware: {
      description: 'Optional middleware functions to run before the handler',
      type: 'array',
    },
  }}
/>

The following examples showcase how to configure an **API Step**

## Using Middleware

API Steps support middleware functions that can be applied to requests before they reach your handler. Middleware functions are completely framework-agnostic and can perform tasks such as:

- Authentication and authorization
- Request logging
- Rate limiting
- CORS handling
- Request validation
- Response transformation

### Middleware Function Signature

```typescript
type ApiMiddleware = (req: ApiRequest, ctx: FlowContext, next: () => Promise<ApiResponse>) => Promise<ApiResponse>
```

Middleware functions receive:

- `req`: The API request object with body, headers, pathParams, and queryParams
- `ctx`: The flow context with logger, state, emit, and traceId
- `next`: A function to call the next middleware or handler in the chain
  - Call `next()` to continue to the next middleware or handler
  - The return value of `next()` is the response from the next middleware or handler
  - You can modify this response before returning it

### Example Middleware Usage

```typescript
import { ApiMiddleware } from 'motia'

// Logging middleware
const loggingMiddleware: ApiMiddleware = async (req, ctx, next) => {
  ctx.logger.info('Request received', { path: req.pathParams })
  const start = Date.now()

  // Call the next middleware and get its response
  const response = await next()

  const duration = Date.now() - start
  ctx.logger.info('Request completed', { duration, status: response.status })

  return response
}

// Authentication middleware
const authMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    // Return early without calling next()
    return {
      status: 401,
      body: { error: 'Unauthorized' },
    }
  }

  // Continue to the next middleware
  return next()
}

export const config = {
  type: 'api',
  name: 'protected-endpoint',
  path: '/api/protected',
  method: 'POST',
  emits: ['USER_ACTION'],
  middleware: [loggingMiddleware, authMiddleware],
}

export const handler = async (req, ctx) => {
  // This handler will only be called if all middleware pass
  return {
    status: 200,
    body: { message: 'Protected data accessed successfully' },
  }
}
```

### Creating Custom Middleware

You can create your own middleware functions:

```typescript
import { ApiMiddleware } from 'motia'

// Request modification middleware
const requestModifierMiddleware: ApiMiddleware = async (req, ctx, next) => {
  // Modify the request before passing it to the next middleware
  req.headers['x-modified-by'] = 'middleware'
  req.body.timestamp = Date.now()

  // Call the next middleware in the chain
  return next()
}

// Response modification middleware
const responseModifierMiddleware: ApiMiddleware = async (req, ctx, next) => {
  // Call the next middleware in the chain
  const response = await next()

  // Modify the response before returning it
  response.headers = {
    ...response.headers,
    'x-powered-by': 'Motia',
  }

  return response
}

// Error handling middleware
const errorHandlingMiddleware: ApiMiddleware = async (req, ctx, next) => {
  try {
    // Call the next middleware in the chain
    return await next()
  } catch (error) {
    ctx.logger.error('Error in handler', { error })
    return {
      status: 500,
      body: { error: 'Internal server error' },
    }
  }
}

// Rate limiter middleware with state
const rateLimiterMiddleware: ApiMiddleware = (() => {
  // Closure to maintain state between requests
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
      return {
        status: 429,
        body: { error: 'Too many requests, please try again later' },
      }
    }

    // Add current request
    requests[ipStr].push(now)

    return next()
  }
})()
```

<Tabs items={['TypeScript', 'JavaScript', 'Python', 'Ruby']}>
  <Tab value="TypeScript">
    ```typescript
      import { ApiRouteConfig, StepHandler } from 'motia'
      import { z } from 'zod'

      export const config: ApiRouteConfig = {
        type: 'api',
        name: 'Test state api trigger',
        description: 'test state',
        path: '/test-state',
        method: 'POST',
        emits: ['test-state'],
        bodySchema: z.object({}),
        flows: ['test-state'],
      }

      export const handler: StepHandler<typeof config> = async (req, { logger, emit }) => {
        logger.info('[Test State] Received request', req)

        await emit({
          topic: 'test-state',
          data: req.body
        })

        return {
          status: 200,
          body: { message: 'Success' },
        }
      }
    ```

  </Tab>
  <Tab value="JavaScript">
    ```javascript
    const { z } = require('zod')

    exports.config = {
      type: 'api',
      name: 'Test state api trigger',
      description: 'test state',
      path: '/test-state',
      method: 'POST',
      emits: ['test-state'],
      bodySchema: z.object({}),
      flows: ['test-state'],
    }

    exports.handler = async (req, { logger, emit }) => {
      logger.info('[Test State] Received request', req)

      await emit({
        topic: 'test-state',
        data: req.body
      })

      return {
        status: 200,
        body: { message: 'Success' },
      }
    }
    ```

  </Tab>

  <Tab value="Python">
    ```python
    from typing import Any, Dict, Callable
    from motia import ApiMiddleware
    from datetime import datetime
    import time

    from pydantic import BaseModel

    # Define a Pydantic model for request body validation
    class RequestBody(BaseModel):
        message: str

    # Request modification middleware
    async def request_modifier_middleware(data: Dict[str, Any], ctx: Any, next_fn: Callable):
        # Modify the request before passing it to the next middleware
        data['headers']['x-modified-by'] = 'middleware'
        data['body']['timestamp'] = int(time.time() * 1000)

        # Call the next middleware in the chain
        return await next_fn()

    # Response modification middleware
    async def response_modifier_middleware(data: Dict[str, Any], ctx: Any, next_fn: Callable):
        # Call the next middleware in the chain
        response = await next_fn()

        # Modify the response before returning it
        response['headers'] = {
            **response.get('headers', {}),
            'x-powered-by': 'Motia'
        }

        return response

    # Error handling middleware
    async def error_handling_middleware(data: Dict[str, Any], ctx: Any, next_fn: Callable):
        try:
            # Call the next middleware in the chain
            return await next_fn()
        except Exception as error:
            ctx.logger.error('Error in handler', {'error': str(error)})
            return {
                'status': 500,
                'body': {'error': 'Internal server error'}
            }

    # Rate limiter middleware with state using a closure
    def create_rate_limiter_middleware():
        # Closure to maintain state between requests
        requests: Dict[str, list] = {}
        limit = 100
        window_ms = 60000  # 1 minute

        async def rate_limiter_middleware(data: Dict[str, Any], ctx: Any, next_fn: Callable):
            ip = data['headers'].get('x-forwarded-for', ['unknown-ip'])
            ip_str = ip[0] if isinstance(ip, list) else ip

            now = int(time.time() * 1000)
            if ip_str not in requests:
                requests[ip_str] = []

            # Remove old requests outside the time window
            requests[ip_str] = [t for t in requests[ip_str] if now - t < window_ms]

            if len(requests[ip_str]) >= limit:
                return {
                    'status': 429,
                    'body': {'error': 'Too many requests, please try again later'}
                }

            # Add current request
            requests[ip_str].append(now)

            return await next_fn()

        return rate_limiter_middleware

    config = {
        'type': 'api',
        'name': 'Test state api trigger',
        'description': 'test state',
        'path': '/test-state',
        'method': 'POST',
        'emits': ['test-state'],
        'flows': ['test-state'],
        'bodySchema': RequestBody.model_json_schema(), # We use jsonschema to validate
        'middleware': [
            request_modifier_middleware,
            response_modifier_middleware,
            error_handling_middleware,
            create_rate_limiter_middleware()
        ]
    }

    async def handler(req, context):
        context.logger.info('[Test State] Received request', {'body': req.get("body")})

        await context.emit({
            'topic': 'test-state',
            'data': req.body
        })

        return {
            'status': 200,
            'body': {'message': 'Success'}
        }
    ```

  </Tab>
  <Tab value="Ruby">
    ```ruby
    def config
      {
        type: 'api',
        name: 'Test state api trigger',
        description: 'test state',
        path: '/test-state',
        method: 'POST',
        emits: ['test-state'],
        flows: ['test-state']
      }
    end

    def handler(req, ctx)
      ctx.emit({
        "topic" => "test-state",
        "data" => req.body
      })

      {
        "status" => 200,
        "body" => { "message" => "Success" }
      }
    end
    ```

  </Tab>
</Tabs>
