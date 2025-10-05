import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * This step shows the WORKAROUND for Zod default values not being applied.
 * 
 * SOLUTION: Use explicit JavaScript default parameters in destructuring.
 * This ensures default values are applied even when Zod doesn't pass them through.
 */

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ZodDefaultsFixed',
  description: 'Demonstrates workaround for Zod default values bug',
  flows: ['bugfix-examples'],
  method: 'POST',
  path: '/api/zod-defaults-fixed',
  bodySchema: z.object({
    message: z.string(),
    priority: z.string().default('normal'),
    retryCount: z.number().default(3),
    enabled: z.boolean().default(true),
  }),
  responseSchema: {
    200: z.object({
      received: z.object({
        message: z.string(),
        priority: z.string(),
        retryCount: z.number(),
        enabled: z.boolean(),
      }),
      defaultsApplied: z.boolean(),
    }),
  },
  emits: [],
}

export const handler: Handlers['ZodDefaultsFixed'] = async (req, { logger }) => {
  // WORKAROUND: Apply defaults manually in JavaScript destructuring
  // This works around the bug where Zod bodySchema defaults aren't applied
  const { 
    message, 
    priority = 'normal',      // JS default parameter
    retryCount = 3,            // JS default parameter  
    enabled = true             // JS default parameter
  } = req.body

  logger.info('Received values (with workaround)', {
    message,
    priority,
    retryCount,
    enabled,
    allDefaultsApplied: priority !== undefined && retryCount !== undefined && enabled !== undefined,
  })

  return {
    status: 200,
    body: {
      received: {
        message,
        priority,
        retryCount,
        enabled,
      },
      defaultsApplied: true,
    },
  }
}
