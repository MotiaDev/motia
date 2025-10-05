import { StepConfig, Handlers } from 'motia'
import { z } from 'zod'

/**
 * MULTIPLE STATE TRIGGERS EXAMPLE
 * 
 * This step demonstrates multiple state triggers monitoring different keys
 * with different conditions for comprehensive system health monitoring.
 */
export const config: StepConfig = {
  name: 'HealthMonitor',
  description: 'Monitors system health via multiple state triggers',
  
  triggers: [
    // Monitor memory usage
    {
      type: 'state',
      key: 'system.memory.usage',
      condition: (value: unknown) => {
        return typeof value === 'number' && value > 80 // Alert if > 80%
      },
      description: 'Monitor memory usage',
    },
    
    // Monitor CPU usage
    {
      type: 'state',
      key: 'system.cpu.usage',
      condition: (value: unknown) => {
        return typeof value === 'number' && value > 75 // Alert if > 75%
      },
      description: 'Monitor CPU usage',
    },
    
    // Monitor error rate
    {
      type: 'state',
      key: 'system.errors.rate',
      condition: (value: unknown) => {
        return typeof value === 'number' && value > 10 // Alert if > 10 errors/min
      },
      description: 'Monitor error rate',
    },
    
    // Monitor active connections
    {
      type: 'state',
      key: 'system.connections.active',
      condition: (value: unknown) => {
        return typeof value === 'number' && value > 1000 // Alert if > 1000 connections
      },
      description: 'Monitor active connections',
    },
    
    // API trigger for manual health check
    {
      type: 'api',
      path: '/health/check',
      method: 'GET',
      description: 'Manual health check',
    },
  ],
  
  input: z.object({
    key: z.string().optional(),
    value: z.union([z.number(), z.string(), z.boolean()]).optional(),
    metric: z.string().optional(),
  }),
  
  responseSchema: {
    200: z.object({
      status: z.string(),
      alerts: z.array(z.object({
        metric: z.string(),
        value: z.number(),
        threshold: z.number(),
        severity: z.string(),
      })),
      timestamp: z.string(),
    }),
  },
  
  emits: ['health.alert', 'health.ok'],
  flows: ['multi-trigger-demo'],
  
  virtualSubscribes: [
    'system.memory.usage',
    'system.cpu.usage', 
    'system.errors.rate',
    'system.connections.active',
  ],
  
  virtualEmits: [
    { topic: 'health.alerts', label: 'Health alerts generated' },
    { topic: 'health.report', label: 'Health report created' },
  ],
}

export const handler: Handlers['HealthMonitor'] = async (req, { state, logger, emit }) => {
  const input = req.body
  const timestamp = new Date().toISOString()
  const alerts: Array<{
    metric: string
    value: number
    threshold: number
    severity: string
  }> = []
  
  try {
    logger.info('Health monitor triggered', { 
      key: input.key,
      metric: input.metric,
    })
    
    // Check all metrics
    const metrics = {
      'system.memory.usage': { threshold: 80, severity: 'high' },
      'system.cpu.usage': { threshold: 75, severity: 'high' },
      'system.errors.rate': { threshold: 10, severity: 'medium' },
      'system.connections.active': { threshold: 1000, severity: 'low' },
    }
    
    for (const [metricKey, config] of Object.entries(metrics)) {
      const value = await state.get('system', metricKey.split('.').pop() || '')
      
      if (typeof value === 'number' && value > config.threshold) {
        alerts.push({
          metric: metricKey,
          value,
          threshold: config.threshold,
          severity: config.severity,
        })
      }
    }
    
    // Store health report
    const healthReport = {
      timestamp,
      status: alerts.length > 0 ? 'warning' : 'healthy',
      alerts,
      checkedMetrics: Object.keys(metrics).length,
    }
    
    await state.set('health', 'latest-report', healthReport)
    
    // Update health history
    const history = (await state.get('health', 'history') || []) as Array<any>
    history.push(healthReport)
    await state.set('health', 'history', history.slice(-100)) // Keep last 100
    
    // Store alert count
    await state.set('health', 'alerts', alerts)
    
    // Emit events based on status
    if (alerts.length > 0) {
      // @ts-expect-error - Multi-trigger steps have emit type issues that will be fixed later
      await emit({
        topic: 'health.alert',
        data: {
          alerts,
          timestamp,
          severity: alerts[0].severity,
        },
      })
      
      logger.warn('Health alerts detected', { alertCount: alerts.length })
    } else {
      // @ts-expect-error - Multi-trigger steps have emit type issues that will be fixed later
      await emit({
        topic: 'health.ok',
        data: {
          timestamp,
          message: 'All systems healthy',
        },
      })
      
      logger.info('All systems healthy')
    }
    
    return {
      status: 200,
      body: {
        status: healthReport.status,
        alerts,
        timestamp,
      },
    }
  } catch (error: unknown) {
    logger.error('Health check failed', { error: String(error) })
    return {
      status: 200,
      body: {
        status: 'error',
        alerts: [],
        timestamp,
      },
    }
  }
}
