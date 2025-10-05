import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * DUAL EVENT TRIGGER EXAMPLE
 * 
 * This step demonstrates multiple triggers of the SAME type (multiple event triggers).
 * It listens to different event topics and processes data accordingly.
 */
export const config: StepConfig = {
  name: 'DataProcessor',
  description: 'Processes data from multiple event sources',
  
  // MULTIPLE EVENT TRIGGERS
  triggers: [
    {
      type: 'event',
      topic: 'data.uploaded',
      description: 'Triggered when new data is uploaded',
    },
    {
      type: 'event',
      topic: 'data.updated',
      description: 'Triggered when existing data is updated',
    },
    {
      type: 'event',
      topic: 'data.validated',
      description: 'Triggered when data passes validation',
    },
  ],
  
  input: z.object({
    dataId: z.string(),
    eventType: z.string(),
    data: z.record(z.any()),
    metadata: z.record(z.any()).optional(),
  }),
  
  emits: [
    { topic: 'data.processed', label: 'Data processed successfully' },
    { topic: 'data.error', label: 'Data processing error' },
  ],
  flows: ['multi-trigger-demo'],
  
  virtualEmits: [
    { topic: 'data.processed', label: 'Data processing completed' },
    { topic: 'data.error', label: 'Data processing error' },
  ],
}

export const handler: Handlers['DataProcessor'] = async (inputOrReq, { state, logger, emit }) => {
  // Extract input from either direct input or API request body
  const input = 'body' in inputOrReq ? inputOrReq.body : inputOrReq
  
  try {
    logger.info('Processing data', { 
      dataId: input.dataId, 
      eventType: input.eventType,
    })
    
    // Process data differently based on event type
    const processingResult = {
      dataId: input.dataId,
      eventType: input.eventType,
      processedAt: new Date().toISOString(),
      status: 'completed',
    }
    
    // Store processing result
    await state.set('data', `processed.${input.dataId}`, processingResult)
    
    // Update processing counter
    const counter = (await state.get('data', 'processing.counter') || 0) as number
    await state.set('data', 'processing.counter', counter + 1)
    
    // Emit success event
    await emit({
      topic: 'data.processed',
      data: processingResult,
    })
    
    logger.info('Data processed successfully', { dataId: input.dataId })
  } catch (error: unknown) {
    logger.error('Data processing failed', { 
      dataId: input.dataId, 
      error: String(error),
    })
    
    await emit({
      topic: 'data.error',
      data: {
        dataId: input.dataId,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
    })
  }
}
