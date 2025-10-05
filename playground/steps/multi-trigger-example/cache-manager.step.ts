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
  
  emits: ['cache.cleaned', 'cache.optimized'],
  flows: ['multi-trigger-demo'],
  
  virtualEmits: [
    { topic: 'cache.size', label: 'Cache size updated' },
    { topic: 'cache.stats', label: 'Cache statistics updated' },
  ],
}

export const handler: Handlers['CacheManager'] = async (req, { state, logger, emit }) => {
  const input = req.body
  try {
    const timestamp = new Date().toISOString()
    
    logger.info('Cache manager started', { operation: input.operation })
    
    // Get current cache data
    const cacheData = await state.get('cache', 'data') || {}
    const currentSize = Object.keys(cacheData).length
    
    let itemsRemoved = 0
    let newCacheData = { ...cacheData }
    
    // Perform operation based on type
    if (input.operation === 'clear' || input.force) {
      // Clear entire cache
      newCacheData = {}
      itemsRemoved = currentSize
    } else if (input.operation === 'optimize') {
      // Remove old entries (older than 1 hour)
      const oneHourAgo = Date.now() - 3600000
      newCacheData = Object.fromEntries(
        Object.entries(cacheData).filter(([key, value]: [string, any]) => {
          if (value.timestamp && new Date(value.timestamp).getTime() > oneHourAgo) {
            return true
          }
          itemsRemoved++
          return false
        })
      )
    } else if (input.operation === 'cleanup') {
      // Remove expired entries
      newCacheData = Object.fromEntries(
        Object.entries(cacheData).filter(([key, value]: [string, any]) => {
          if (!value.expiresAt || new Date(value.expiresAt).getTime() > Date.now()) {
            return true
          }
          itemsRemoved++
          return false
        })
      )
    }
    
    // Update cache
    await state.set('cache', 'data', newCacheData)
    const newSize = Object.keys(newCacheData).length
    await state.set('cache', 'size', newSize)
    
    // Update statistics
    const stats = (await state.get('cache', 'stats') || {
      totalCleanups: 0,
      totalItemsRemoved: 0,
      lastCleanup: null,
    }) as { totalCleanups: number; totalItemsRemoved: number; lastCleanup: string | null }
    stats.totalCleanups += 1
    stats.totalItemsRemoved += itemsRemoved
    stats.lastCleanup = timestamp
    await state.set('cache', 'stats', stats)
    
    // Emit appropriate event
    const eventTopic = input.operation === 'optimize' ? 'cache.optimized' : 'cache.cleaned'
    // @ts-expect-error - Multi-trigger steps have emit type issues that will be fixed later
    await emit({
      topic: eventTopic,
      data: {
        operation: input.operation,
        itemsRemoved,
        cacheSize: newSize,
        timestamp,
      },
    })
    
    logger.info('Cache operation completed', { 
      operation: input.operation,
      itemsRemoved,
      newSize,
    })
    
    const operation = String(input.operation || 'cleanup')
    
    return {
      status: 200,
      body: {
        message: `Cache ${operation} completed successfully`,
        operation,
        itemsRemoved,
        cacheSize: newSize,
        timestamp,
      },
    }
  } catch (error: unknown) {
    logger.error('Cache operation failed', { error: String(error) })
    return {
      status: 500,
      body: { error: 'Cache operation failed' },
    }
  }
}
