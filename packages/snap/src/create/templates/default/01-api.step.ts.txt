import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ApiTrigger',
  description: 'default template api trigger',

  method: 'POST',
  path: '/default',

  /**
   * This API Step emits events to topic `test-state`
   */
  emits: ['test-state'],

  /** 
   * Expected request body for type checking and documentation
   */
  bodySchema: z.object({ message: z.string() }),

  /** 
   * Expected response body for type checking and documentation
   */
  responseSchema: {
    200: z.object({ 
      message: z.string(),
      traceId: z.string(),
    })
  },

  /** 
   * We're using virtual subscribes to virtually connect noop step
   * to this step.
   *
   * Noop step is defined in noop.step.ts
   */
  virtualSubscribes: ['/default'],

  /**
   * The flows this step belongs to, will be available in Workbench
   */
  flows: ['default'],
}

export const handler: Handlers['ApiTrigger'] = async (req, { logger, emit, traceId }) => {
  /** 
   * Avoid usage of console.log, use logger instead
   */
  logger.info('Step 01 – Processing API Step', { body: req.body })

  /**
   * Emit events to the topics to process asynchronously
   */
  await emit({
    topic: 'test-state',
    data: { message: req.body.message },
  })

  /**
   * Return data back to the client
   */
  return {
    status: 200,
    body: {
      traceId,
      message: 'test-state topic emitted',
    },
  }
}
