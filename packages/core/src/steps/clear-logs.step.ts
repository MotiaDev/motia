import { ApiResponse, ApiRouteConfig, ApiRouteHandler } from '../types'
import { z } from 'zod'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Clear Logs',
  description: 'System endpoint for clearing log data',
  path: '/__motia/clear-logs',
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
  logger.info('[Clear Logs] Clearing log data')

  try {
    // Access the logs stream through the streams context
    const logStream = (streams as any)['__motia.logs']
    
    if (logStream) {
      // Clear all log groups
      const groups = await logStream.getGroup('default')
      for (const log of groups) {
        await logStream.delete('default', log.id)
      }
    }

    return {
      status: 200,
      body: { message: 'Logs cleared successfully' },
    }
  } catch (error) {
    logger.error('[Clear Logs] Failed to clear logs', { error })
    return {
      status: 500,
      body: { message: 'Failed to clear logs' },
    }
  }
}
