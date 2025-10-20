import type { ApiResponse, ApiRouteConfig, ApiRouteHandler } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ApiExampleApiTrigger',
  description: 'api example',
  path: '/api-example',
  method: 'POST',
  emits: [],
  bodySchema: z.object({}),
  flows: ['api-example'],
}

export const handler: ApiRouteHandler<unknown, ApiResponse<200, { message: string }>, never> = async (
  req,
  { logger },
) => {
  logger.info('[ApiExampleApiTrigger] triggering api step', req)

  return {
    status: 200,
    body: { message: 'hello from api example' },
  }
}
