import { z } from 'zod'
import type { ApiResponse, ApiRouteConfig, ApiRouteHandler } from '../types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Event Emitter',
  description: 'System endpoint for emitting events',
  path: '/emit',
  method: 'POST',
  emits: [], // Dynamic emissions
  flows: ['_system'],
  bodySchema: z.object({
    topic: z.string(),
    data: z.record(z.string(), z.any()),
  }),
}

type EmitData = { topic: string; data: Record<string, unknown> }

export const handler: ApiRouteHandler<
  EmitData,
  ApiResponse<200, { success: true; emitted: EmitData }>,
  EmitData
> = async (req, { emit, logger }) => {
  const { topic, data } = req.body

  logger.info('[Event Emitter] Emitting event', { topic, data })
  await emit({ topic, data })

  return {
    status: 200,
    body: { success: true, emitted: { topic, data } },
  }
}
