import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * This step demonstrates a bug where Zod schema defaults
 * defined in bodySchema are not applied to req.body.
 * 
 * BUG: When fields with .default() are omitted from the request,
 * they arrive as undefined in req.body instead of the default value.
 * 
 * WORKAROUND: Use explicit JavaScript default parameters in destructuring.
 */

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ZodDefaultsBug',
  description: 'Demonstrates Zod default values not being applied to req.body',
  flows: ['bugfix-examples'],
  method: 'POST',
  path: '/api/zod-defaults-bug',
  bodySchema: z.object({
    message: z.string(),
    // These defaults are NOT applied to req.body
    priority: z.string().default('normal'),
    retryCount: z.number().default(3),
    enabled: z.boolean().default(true),
  }),
  responseSchema: {
    200: z.object({
      received: z.object({
        message: z.string(),
        priority: z.string().optional(),
        retryCount: z.number().optional(),
        enabled: z.boolean().optional(),
      }),
      expectedDefaults: z.object({
        priority: z.string(),
        retryCount: z.number(),
        enabled: z.boolean(),
      }),
      bugPresent: z.boolean(),
    }),
  },
  emits: [],
}

export const handler: Handlers['ZodDefaultsBug'] = async (req, { logger }) => {
  // BUG: Zod defaults are NOT applied here
  // If fields are omitted, they will be undefined instead of default values
  const { message, priority, retryCount, enabled } = req.body

  logger.info('Received values (bug demonstration)', {
    message,
    priority,
    retryCount,
    enabled,
    priorityIsUndefined: priority === undefined,
    retryCountIsUndefined: retryCount === undefined,
    enabledIsUndefined: enabled === undefined,
  })

  // WORKAROUND: Apply defaults manually in destructuring
  // const { 
  //   message, 
  //   priority = 'normal', 
  //   retryCount = 3, 
  //   enabled = true 
  // } = req.body

  return {
    status: 200,
    body: {
      received: {
        message,
        priority,
        retryCount,
        enabled,
      },
      expectedDefaults: {
        priority: 'normal',
        retryCount: 3,
        enabled: true,
      },
      bugPresent: priority === undefined || retryCount === undefined || enabled === undefined,
    },
  }
}
