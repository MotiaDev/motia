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
  
  // MULTIPLE EVENT TRIGGERS - processes data from analytics
  triggers: [
    {
      type: 'event',
      topic: 'analytics.completed',
      description: 'Triggered when analytics completes (flows from ComprehensiveAnalytics)',
    },
    {
      type: 'event',
      topic: 'data.uploaded',
      description: 'Triggered when new data is uploaded',
    },
    {
      type: 'event',
      topic: 'data.validated',
      description: 'Triggered when data passes validation',
    },
  ],
  
  input: z.object({
    analyticsId: z.string().optional(),
    dataId: z.string().optional(),
    eventType: z.string().optional(),
    triggeredBy: z.string().optional(),
    data: z.record(z.any()).optional(),
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
  
  // Generate dataId based on input source
  const dataId = input.dataId || input.analyticsId || `data_${Date.now()}`
  
  logger.info('Processing data', { 
    dataId, 
    source: input.analyticsId ? 'analytics' : 'direct',
  })
  
  // Process data (simplified)
  const processingResult = {
    dataId,
    processedFrom: input.analyticsId ? 'analytics' : 'upload',
    processedAt: new Date().toISOString(),
    status: 'completed',
  }
  
  // Emit success event (fire and forget) - NotificationSender subscribes to this
  emit({
    topic: 'data.processed',
    data: processingResult,
  })
  
  logger.info('Data processed successfully', { dataId })
}
