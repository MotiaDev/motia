import { createTrace } from '../observability/create-trace'
import { Step } from '../types'
import { TraceGroup } from '../observability/types'

describe('Observability Tests', () => {
  describe('createTrace', () => {
    it('should use primary trigger type instead of unknown when config.type is missing', () => {
      const traceGroup: TraceGroup = {
        id: 'test-trace-group',
        name: 'Test Group',
        lastActivity: Date.now(),
        metadata: {
          completedSteps: 0,
          activeSteps: 0,
          totalSteps: 0,
        },
        correlationId: undefined,
        status: 'running',
        startTime: Date.now(),
      }

      // Test API trigger step
      const apiStep: Step = {
        filePath: '/test-api.step.ts',
        version: '1',
        config: {
          name: 'APIStep',
          triggers: [
            {
              type: 'api',
              path: '/api/test',
              method: 'POST',
            },
          ],
        },
      }

      const apiTrace = createTrace(traceGroup, apiStep)
      expect(apiTrace.entryPoint.type).toBe('api')

      // Test event trigger step
      const eventStep: Step = {
        filePath: '/test-event.step.ts',
        version: '1',
        config: {
          name: 'EventStep',
          triggers: [
            {
              type: 'event',
              topic: 'test.event',
            },
          ],
        },
      }

      const eventTrace = createTrace(traceGroup, eventStep)
      expect(eventTrace.entryPoint.type).toBe('event')

      // Test cron trigger step
      const cronStep: Step = {
        filePath: '/test-cron.step.ts',
        version: '1',
        config: {
          name: 'CronStep',
          triggers: [
            {
              type: 'cron',
              cron: '0 0 * * *',
            },
          ],
        },
      }

      const cronTrace = createTrace(traceGroup, cronStep)
      expect(cronTrace.entryPoint.type).toBe('cron')

      // Test noop step (no triggers)
      const noopStep: Step = {
        filePath: '/test-noop.step.ts',
        version: '1',
        config: {
          name: 'NoopStep',
          triggers: [],
        },
      }

      const noopTrace = createTrace(traceGroup, noopStep)
      expect(noopTrace.entryPoint.type).toBe('noop')

      // Test multi-trigger step
      const multiStep: Step = {
        filePath: '/test-multi.step.ts',
        version: '1',
        config: {
          name: 'MultiStep',
          triggers: [
            {
              type: 'api',
              path: '/api/test',
              method: 'GET',
            },
            {
              type: 'event',
              topic: 'test.event',
            },
          ],
        },
      }

      const multiTrace = createTrace(traceGroup, multiStep)
      expect(multiTrace.entryPoint.type).toBe('api') // Should use first trigger type (API)
    })

    it('should fall back to config.type if present (backward compatibility)', () => {
      const traceGroup: TraceGroup = {
        id: 'test-trace-group',
        name: 'Test Group',
        lastActivity: Date.now(),
        metadata: {
          completedSteps: 0,
          activeSteps: 0,
          totalSteps: 0,
        },
        correlationId: undefined,
        status: 'running',
        startTime: Date.now(),
      }

      // Test step with both config.type and triggers
      const legacyStep: Step = {
        filePath: '/test-legacy.step.ts',
        version: '1',
        config: {
          name: 'LegacyStep',
          type: 'api', // Legacy type field
          triggers: [
            {
              type: 'event',
              topic: 'test.event',
            },
          ],
        },
      }

      const legacyTrace = createTrace(traceGroup, legacyStep)
      expect(legacyTrace.entryPoint.type).toBe('event') // Should use trigger-based detection
    })
  })
})
