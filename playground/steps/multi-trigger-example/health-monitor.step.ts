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
  
  emits: [
    { topic: 'health.alert', label: 'Health alert triggered' },
    { topic: 'health.ok', label: 'System healthy' },
  ],
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

export const handler: Handlers['HealthMonitor'] = async (inputOrReq, { state, logger, emit }) => {
  // Extract input from either direct input or API request body
  const input = 'body' in inputOrReq ? inputOrReq.body : inputOrReq
  const isApiTrigger = 'body' in inputOrReq
  
  const timestamp = new Date().toISOString()
  const alerts: Array<any> = []
  const status = 'healthy'
  
  logger.info('Health monitor triggered')
  
  // Emit health status (fire and forget)
  emit({
    topic: 'health.ok',
    data: {
      timestamp,
      message: 'All systems healthy',
    },
  })
  
  logger.info('All systems healthy')
  
  // Return API response only if triggered via API
  if (isApiTrigger) {
    return {
      status: 200,
      body: {
        status,
        alerts,
        timestamp,
      },
    }
  }
}
