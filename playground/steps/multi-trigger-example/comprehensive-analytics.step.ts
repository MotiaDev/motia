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
  
  
  emits: ['analytics.completed', 'analytics.alert'],
  flows: ['multi-trigger-demo'],
  
  virtualEmits: [
    { topic: 'analytics.results', label: 'Analytics results calculated' },
    { topic: 'analytics.history', label: 'Analytics history updated' },
  ],
}

export const handler: Handlers['ComprehensiveAnalytics'] = async (input, { state, logger, emit, traceId }) => {
  const analyticsId = `analytics_${Date.now()}`
  const timestamp = new Date().toISOString()
  
  try {
    // Determine which trigger fired this execution
    const triggeredBy = determineTriggeredBy(input)
    
    logger.info('Analytics engine started', { 
      analyticsId, 
      triggeredBy,
      userId: input.userId,
    })
    
    // Get current analytics data
    const existingMetrics = (await state.get('global', 'analytics.metrics') || {
      totalUsers: 0,
      totalActivities: 0,
      averageScore: 0,
    }) as { totalUsers: number; totalActivities: number; averageScore: number }
    
    // Calculate new metrics based on input
    const newMetrics = {
      totalUsers: existingMetrics.totalUsers + (input.userId ? 1 : 0),
      totalActivities: existingMetrics.totalActivities + 1,
      averageScore: existingMetrics.averageScore,
      lastCalculated: timestamp,
      triggeredBy,
    }
    
    // Store updated analytics results
    await state.set('global', 'analytics.results', {
      id: analyticsId,
      metrics: newMetrics,
      timestamp,
      triggeredBy,
    })
    
    // Store in analytics history
    const history = (await state.get('global', 'analytics.history') || []) as Array<any>
    history.push({
      id: analyticsId,
      timestamp,
      triggeredBy,
      metricsCalculated: Object.keys(newMetrics).length,
    })
    await state.set('global', 'analytics.history', history.slice(-100)) // Keep last 100
    
    // Update metrics (this will trigger state monitors)
    await state.set('global', 'analytics.metrics', newMetrics)
    
    // Emit completion event
    // @ts-expect-error - Multi-trigger steps have emit type issues that will be fixed later
    await emit({
      topic: 'analytics.completed',
      data: {
        analyticsId,
        triggeredBy,
        metrics: newMetrics,
        timestamp,
      },
    })
    
    // Check for alerts
    if (newMetrics.totalActivities > 1000 && newMetrics.totalActivities % 1000 === 0) {
      // @ts-expect-error - Multi-trigger steps have emit type issues that will be fixed later
      await emit({
        topic: 'analytics.alert',
        data: {
          type: 'milestone',
          message: `Reached ${newMetrics.totalActivities} total activities`,
          timestamp,
        },
      })
    }
    
    logger.info('Analytics calculation completed', { 
      analyticsId,
      metricsCalculated: Object.keys(newMetrics).length,
    })
  } catch (error: unknown) {
    logger.error('Analytics calculation failed', { error: String(error) })
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
