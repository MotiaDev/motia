import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * CRON + API + STATE TRIGGER EXAMPLE
 * 
 * This step demonstrates three trigger types for cache management:
 * - Cron: Scheduled cache cleanup
 * - API: Manual cache operations
 * - State: Monitor cache size and trigger cleanup
 */
export const config: StepConfig = {
  name: 'CacheManager',
  description: 'Manages cache with automatic cleanup and manual controls',
  
  triggers: [
    // Cron Trigger - Scheduled cache cleanup
    {
      type: 'cron',
      cron: '0 */2 * * *', // Every 2 hours
      description: 'Scheduled cache cleanup every 2 hours',
    },
    
    // API Triggers - Manual cache operations
    {
      type: 'api',
      path: '/cache/clear',
      method: 'POST',
      description: 'Manually clear cache',
    },
    {
      type: 'api',
      path: '/cache/optimize',
      method: 'POST',
      description: 'Manually optimize cache',
    },
    
    // State Trigger - Monitor cache size
    {
      type: 'state',
      key: 'cache.size',
      condition: (value: unknown) => {
        return typeof value === 'number' && value > 1000
      },
      description: 'Triggered when cache size exceeds threshold',
    },
  ],
  
  input: z.object({
    operation: z.enum(['clear', 'optimize', 'cleanup']).optional().default('cleanup'),
    force: z.boolean().optional().default(false),
  }),
  
  responseSchema: {
    200: z.object({
      message: z.string(),
      operation: z.string(),
      itemsRemoved: z.number(),
      cacheSize: z.number(),
      timestamp: z.string(),
    }),
    500: z.object({ error: z.string() }),
  },
  
  emits: [
    { topic: 'cache.cleaned', label: 'Cache cleaned' },
    { topic: 'cache.optimized', label: 'Cache optimized' },
  ],
  flows: ['multi-trigger-demo'],
  
  virtualEmits: [
    { topic: 'cache.size', label: 'Cache size updated' },
    { topic: 'cache.stats', label: 'Cache statistics updated' },
  ],
}

export const handler: Handlers['CacheManager'] = async (inputOrReq, { state, logger, emit }) => {
  // Extract input from either direct input or API request body
  const input = 'body' in inputOrReq ? inputOrReq.body : inputOrReq
  const isApiTrigger = 'body' in inputOrReq
  
  const timestamp = new Date().toISOString()
  const operation = input.operation || 'cleanup'
  const itemsRemoved = 0
  const cacheSize = 0
  
  logger.info('Cache manager started', { operation })
  
  // Emit appropriate event (fire and forget)
  const eventTopic = operation === 'optimize' ? 'cache.optimized' : 'cache.cleaned'
  emit({
    topic: eventTopic,
    data: {
      operation,
      itemsRemoved,
      cacheSize,
      timestamp,
    },
  })
  
  logger.info('Cache operation completed', { operation, itemsRemoved, cacheSize })
  
  // Return API response only if triggered via API
  if (isApiTrigger) {
    return {
      status: 200,
      body: {
        message: `Cache ${operation} completed successfully`,
        operation,
        itemsRemoved,
        cacheSize,
        timestamp,
      },
    }
  }
}
