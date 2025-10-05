import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * COMPREHENSIVE MULTI-TRIGGER EXAMPLE
 * 
 * This step demonstrates ALL four trigger types working together:
 * 1. API Trigger - Manual analytics run via HTTP endpoint
 * 2. Event Trigger - Triggered by user activity events
 * 3. Cron Trigger - Scheduled analytics runs
 * 4. State Trigger - Triggered when analytics data changes
 * 
 * This showcases how a single step can be triggered in multiple ways,
 * making it flexible for different use cases.
 */
export const config: StepConfig = {
  name: 'ComprehensiveAnalytics',
  description: 'Analytics engine that can be triggered via API, events, schedule, or state changes',
  
  // MULTIPLE TRIGGERS OF DIFFERENT TYPES
  triggers: [
    // 1. API Trigger - Manual analytics run
    {
      type: 'api',
      path: '/analytics/run',
      method: 'POST',
      description: 'Manually trigger analytics calculation',
    },
    
    // 2. Event Trigger - Triggered by user activity
    {
      type: 'event',
      topic: 'user.activity',
      description: 'Triggered when user performs significant activity',
    },
    
    // 3. Cron Trigger - Scheduled analytics runs
    {
      type: 'cron',
      cron: '0 */4 * * *', // Every 4 hours
      description: 'Scheduled analytics calculation every 4 hours',
    },
    
    // 4. State Trigger - Triggered when analytics config changes
    {
      type: 'state',
      key: 'analytics.config',
      condition: (value: unknown) => {
        return typeof value === 'object' && value !== null
      },
      description: 'Triggered when analytics configuration is updated',
    },
  ],
  
  input: z.object({
    userId: z.string().optional(),
    activityType: z.string().optional(),
    timestamp: z.string().optional(),
    forceRecalculation: z.boolean().optional(),
  }),
  
  
  emits: [
    { topic: 'analytics.completed', label: 'Analytics calculation completed' },
    { topic: 'analytics.alert', label: 'Analytics alert triggered' },
  ],
  flows: ['multi-trigger-demo'],
  
  virtualEmits: [
    { topic: 'analytics.results', label: 'Analytics results calculated' },
    { topic: 'analytics.history', label: 'Analytics history updated' },
  ],
}

export const handler: Handlers['ComprehensiveAnalytics'] = async (inputOrReq, { state, logger, emit, traceId }) => {
  // Extract input from either direct input or API request body
  const input = 'body' in inputOrReq ? inputOrReq.body : inputOrReq
  const isApiTrigger = 'body' in inputOrReq
  
  const analyticsId = `analytics_${Date.now()}`
  const timestamp = new Date().toISOString()
  const triggeredBy = determineTriggeredBy(input)
  const metricsCalculated = 5
  
  logger.info('Analytics engine started', { analyticsId, triggeredBy })
  
  // Emit completion event (fire and forget)
  emit({
    topic: 'analytics.completed',
    data: {
      analyticsId,
      triggeredBy,
      metricsCalculated,
      timestamp,
    },
  })
  
  logger.info('Analytics calculation completed', { analyticsId, metricsCalculated })
  
  // Return API response only if triggered via API
  if (isApiTrigger) {
    return {
      status: 200,
      body: {
        message: 'Analytics calculation completed successfully',
        analyticsId,
        triggeredBy,
        metricsCalculated,
        timestamp,
      },
    }
  }
}

// Helper function to determine which trigger type fired
function determineTriggeredBy(input: any): string {
  // API trigger typically includes request-specific fields
  if (input.forceRecalculation !== undefined) {
    return 'api'
  }
  // Event trigger includes activity type
  if (input.activityType) {
    return 'event'
  }
  // State trigger includes state-specific metadata
  if (input.key === 'analytics.config') {
    return 'state'
  }
  // Otherwise, it's likely the cron trigger
  return 'cron'
}
