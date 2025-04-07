import { EventConfig, StepHandler } from 'motia'
import { z } from 'zod'
import { queueItemSchema } from './manager.event.step'

// Define the input schema for events this step subscribes to
const inputSchema = z.object({
  finishedTraceId: z.string(),
  result: z.any().optional(), // The result payload from the worker
})

export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Dequeue Next Item',
  description: 'Receives finished events from worker and triggers the next queued item if available.',
  subscribes: ['queue.finished'], // Listen for worker completion events
  emits: ['queue.process'], // Emits event to start the next worker
  input: inputSchema,
  flows: ['state-queue-flow'], // Associate with our example flow
}

// Constants for state management (must match manager step)
const QUEUE_SCOPE = 'state-queue-lock'
const IS_RUNNING_KEY = 'is_running'
const QUEUE_KEY = 'request_queue'
const CURRENT_TRACE_ID_KEY = 'current_traceId'

export const handler: StepHandler<typeof config> = async (input, { logger, state, emit, traceId }) => {
  // Extract data from the event
  const { finishedTraceId, result } = input
  logger.info(`[${config.name}] Received finished event for traceId: ${finishedTraceId}`, {
    newTraceId: traceId,
    finishedTraceId,
    result,
  })

  const currentLockHolder = await state.get<string>(QUEUE_SCOPE, CURRENT_TRACE_ID_KEY)

  if (finishedTraceId !== currentLockHolder) {
    logger.warn(
      `[${config.name}] Event from unexpected traceId ${finishedTraceId}. Current lock holder: ${currentLockHolder}. Ignoring.`,
      { newTraceId: traceId, finishedTraceId },
    )
    // This might happen if a worker took too long, errored, and another somehow started.
    // Or if the event is duplicated.
    return
  }

  logger.info(`[${config.name}] Worker finished for request ${finishedTraceId}. Checking queue.`, {
    newTraceId: traceId,
    finishedTraceId,
  })
  const currentQueue = (await state.get<z.infer<typeof queueItemSchema>[]>(QUEUE_SCOPE, QUEUE_KEY)) || []

  if (currentQueue.length > 0) {
    // Dequeue next item and process it
    const nextRequest = currentQueue.shift()!
    logger.info(`[${config.name}] Dequeuing next request ${nextRequest.traceId}. Queue size: ${currentQueue.length}`, {
      newTraceId: traceId,
      nextRequestTraceId: nextRequest.traceId,
    })

    await state.set(QUEUE_SCOPE, QUEUE_KEY, currentQueue) // Save updated queue
    await state.set(QUEUE_SCOPE, CURRENT_TRACE_ID_KEY, nextRequest.traceId) // Update lock holder to the *next* item's original traceId

    await emit({
      topic: 'queue.process',
      data: {
        body: nextRequest.body,
        traceId: nextRequest.traceId, // Pass the *original* traceId of the dequeued item to the worker
      },
    })

    logger.info(
      `[${config.name}] Emitted queue.process event for next item (original traceId: ${nextRequest.traceId}).`,
    )
  } else {
    // Queue is empty, release the lock
    logger.info(`[${config.name}] Queue is empty. Releasing lock held by ${finishedTraceId}.`, {
      newTraceId: traceId,
      finishedTraceId,
    })
    await state.set(QUEUE_SCOPE, IS_RUNNING_KEY, false) // Explicitly set to false
    await state.delete(QUEUE_SCOPE, CURRENT_TRACE_ID_KEY) // Clean up lock holder
  }
}
