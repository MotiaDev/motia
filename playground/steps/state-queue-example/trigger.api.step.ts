import { ApiRouteConfig, StepHandler } from 'motia'
import { z } from 'zod'

// Define the expected request body structure
const bodySchema = z.object({
  itemId: z.string().min(1, 'itemId is required'),
  payload: z.any().optional(), // Allow any additional payload
})

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Queue Trigger API',
  description: 'Receives items to be processed sequentially via a state-managed queue.',
  path: '/state-queue/process-item', // The API endpoint path
  method: 'POST',
  emits: ['queue.request'], // Event emitted to start the queue manager
  bodySchema: bodySchema,
  flows: ['state-queue-flow'], // Associate with our example flow
}

export const handler: StepHandler<typeof config> = async (req, { logger, emit, traceId }) => {
  logger.info(`[${config.name}] Received request for itemId: ${req.body.itemId}`, { traceId })

  // Emit an event to the queue manager step
  await emit({
    topic: 'queue.request',
    data: {
      // Pass the original request body and the unique traceId
      requestBody: req.body,
      originalTraceId: traceId,
    },
  })

  // Respond immediately to the client
  return {
    status: 202, // Accepted for processing
    body: {
      message: 'Request accepted and queued for processing.',
      traceId: traceId, // Return the traceId for potential tracking
    },
  }
}
