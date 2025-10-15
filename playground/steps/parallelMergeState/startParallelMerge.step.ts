import type { ApiMiddleware, ApiRouteConfig, Handlers } from 'motia'

const timingMiddleware: ApiMiddleware = async (_, ctx, next) => {
  const start = Date.now()

  const response = await next()

  const duration = Date.now() - start
  ctx.logger.info(`Request completed in ${duration}ms`)

  return response
}

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Parallel Merge',
  description: 'Triggered when a message is received from parallel merge',
  path: '/api/parallel-merge',
  method: 'POST',
  virtualSubscribes: ['/api/parallel-merge'],
  emits: ['pms.start'],
  flows: ['parallel-merge'],
  middleware: [timingMiddleware],
}

export const handler: Handlers['Parallel Merge'] = async (_, { emit, logger, traceId }) => {
  logger.info('Starting parallel merge')

  await emit({
    topic: 'pms.start',
    data: {},
  })

  return {
    status: 200,
    body: {
      traceId,
      message: 'Started parallel merge',
    },
  }
}
