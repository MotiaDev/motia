import { EventConfig, StepHandler } from 'motia'
import { z } from 'zod'

// Define the structure of items in the queue
export const queueItemSchema = z.object({
  body: z.any(), // The original request body
  traceId: z.string(), // The traceId of the original request
})

// Define the input schema for events this step subscribes to
const inputSchema = z.object({
  requestBody: z.any(),
  originalTraceId: z.string(),
})

export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Queue Manager',
  description: 'Handles initial queue requests and manages the lock state.',
  subscribes: ['queue.request'], // Only listens for new requests now
  emits: ['queue.process'], // Emits event to start the worker
  input: inputSchema,
  flows: ['state-queue-flow'],
}

// Constants for state management
const QUEUE_SCOPE = 'state-queue-lock' // Fixed scope for global lock/queue
const IS_RUNNING_KEY = 'is_running'
const QUEUE_KEY = 'request_queue'
const CURRENT_TRACE_ID_KEY = 'current_traceId'

export const handler: StepHandler<typeof config> = async (input, { logger, state, emit }) => {
  // Extract data from the event
  const { requestBody, originalTraceId } = input

  logger.info(`[${config.name}] Received event: ${originalTraceId}`, { traceId: originalTraceId })

  // --- Handle new request ---
  const isRunning = await state.get<boolean>(QUEUE_SCOPE, IS_RUNNING_KEY)

  if (!isRunning) {
    // Lock is free, process immediately
    logger.info(`[${config.name}] Lock is free. Processing request ${originalTraceId}.`, {
      traceId: originalTraceId,
    })
    await state.set(QUEUE_SCOPE, IS_RUNNING_KEY, true)
    await state.set(QUEUE_SCOPE, CURRENT_TRACE_ID_KEY, originalTraceId)
    await emit({
      topic: 'queue.process',
      data: {
        body: requestBody,
        traceId: originalTraceId, // Pass original traceId to worker
      },
    })
  } else {
    // Lock is busy, add to queue
    logger.info(`[${config.name}] Lock is busy. Queuing request ${originalTraceId}.`, {
      traceId: originalTraceId,
    })
    const currentQueue = (await state.get<z.infer<typeof queueItemSchema>[]>(QUEUE_SCOPE, QUEUE_KEY)) || []
    currentQueue.push({ body: requestBody, traceId: originalTraceId })
    await state.set(QUEUE_SCOPE, QUEUE_KEY, currentQueue)
    logger.info(`[${config.name}] Queue size: ${currentQueue.length}`, { traceId: originalTraceId })
  }
}
