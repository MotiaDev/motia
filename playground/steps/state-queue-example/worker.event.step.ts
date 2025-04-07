import { EventConfig, StepHandler } from 'motia'
import { z } from 'zod'

// Define the input schema for the event from the manager
const inputSchema = z.object({
  body: z.object({
    itemId: z.string(),
    payload: z.any().optional(),
  }),
  traceId: z.string(), // The original request's traceId
})

export const config: EventConfig<typeof inputSchema> = {
  type: 'event',
  name: 'Queue Worker',
  description: 'Simulates processing an item from the queue and emits an event to trigger the next item.',
  subscribes: ['queue.process'], // Listens for the signal to start processing
  emits: ['queue.finished'], // Emits when processing is complete to trigger next item
  input: inputSchema,
  flows: ['state-queue-flow'],
}

// Helper function to simulate delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const handler: StepHandler<typeof config> = async (input, { logger, emit }) => {
  const { body, traceId } = input
  const itemId = body.itemId
  const processingTime = 2000 + Math.random() * 1000 // Simulate 2-3 seconds of work

  logger.info(`[${config.name}] Started processing item: ${itemId}`, { traceId })

  try {
    // Simulate asynchronous work
    await sleep(processingTime)

    const resultPayload = {
      processedItemId: itemId,
      status: 'completed',
      processedAt: new Date().toISOString(),
    }

    logger.info(`[${config.name}] Finished processing item: ${itemId}`, { traceId, duration: processingTime })

    // Emit an event to trigger the next item in the queue
    logger.info(`[${config.name}] Emitting queue.finished event for traceId: ${traceId}`, { traceId })

    await emit({
      topic: 'queue.finished',
      data: {
        finishedTraceId: traceId,
        result: resultPayload,
      },
    })

    logger.info(`[${config.name}] Successfully emitted queue.finished event for traceId: ${traceId}`, { traceId })
  } catch (error) {
    logger.error(`[${config.name}] Error processing item: ${itemId}`, { traceId, error })

    // Still attempt to emit the event even on error to potentially unlock the queue
    logger.warn(`[${config.name}] Attempting to emit queue.finished event after error for traceId: ${traceId}`, {
      traceId,
    })

    await emit({
      topic: 'queue.finished',
      data: {
        finishedTraceId: traceId,
        result: {
          processedItemId: itemId,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        },
      },
    })

    logger.info(`[${config.name}] Successfully emitted queue.finished event after error for traceId: ${traceId}`, {
      traceId,
    })
  }
}
