import { ApiResponse, StepConfig, ApiRouteHandler } from '../types'
import { z } from 'zod'

export const config: StepConfig = {
  name: 'Event Emitter',
  description: 'System endpoint for emitting events',
  triggers: [
    {
      type: 'api',
      path: '/emit',
      method: 'POST',
    },
  ],
  path: '/emit',
  method: 'POST',
  emits: [], // Dynamic emissions
  flows: ['_system'],
  bodySchema: z.object({
    topic: z.string(),
    data: z.record(z.unknown()),
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
