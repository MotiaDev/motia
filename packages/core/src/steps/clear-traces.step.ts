import { ApiResponse, ApiRouteConfig, ApiRouteHandler } from '../types'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Clear Traces',
  description: 'System endpoint for clearing trace data',
  path: '/__motia/clear-traces',
  method: 'POST',
  emits: [],
  flows: ['_system'],
  bodySchema: z.object({}),
}

export const handler: ApiRouteHandler<
  {},
  ApiResponse<200, { message: string }> | ApiResponse<500, { message: string }>,
  {}
> = async (req, { streams, logger }) => {
  logger.info('[Clear Traces] Clearing trace data')

  try {
    // Access the trace streams through the streams context
    const traceStream = (streams as any)['motia-trace']
    const traceGroupStream = (streams as any)['motia-trace-group']
    
    if (traceStream && traceGroupStream) {
      // Clear all trace groups
      const groups = await traceGroupStream.getGroup('default')
      for (const group of groups) {
        // Clear all traces in the group
        const traces = await traceStream.getGroup(group.id)
        for (const trace of traces) {
          await traceStream.delete(group.id, trace.id)
        }
        // Delete the group itself
        await traceGroupStream.delete('default', group.id)
      }
    }

    return {
      status: 200,
      body: { message: 'Traces cleared successfully' },
    }
  } catch (error) {
    logger.error('[Clear Traces] Failed to clear traces', { error })
    return {
      status: 500,
      body: { message: 'Failed to clear traces' },
    }
  }
}
