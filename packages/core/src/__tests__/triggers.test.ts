import { Step, StepConfig } from '../types'
import { hasApiTrigger, hasEventTrigger, hasCronTrigger, hasStateTrigger, getTriggersByType } from '../guards'
import { validateStep } from '../step-validator'

describe('Triggers System', () => {
  describe('Guard Functions', () => {
    it('should correctly identify API triggers', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'API Step',
          triggers: [{
            type: 'api',
            path: '/api/test',
            method: 'POST',
          }],
        },
      }

      expect(hasApiTrigger(step)).toBe(true)
      expect(hasEventTrigger(step)).toBe(false)
      expect(hasCronTrigger(step)).toBe(false)
      expect(hasStateTrigger(step)).toBe(false)
    })

    it('should correctly identify event triggers', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Event Step',
          triggers: [{
            type: 'event',
            topic: 'test.event',
          }],
        },
      }

      expect(hasApiTrigger(step)).toBe(false)
      expect(hasEventTrigger(step)).toBe(true)
      expect(hasCronTrigger(step)).toBe(false)
      expect(hasStateTrigger(step)).toBe(false)
    })

    it('should correctly identify cron triggers', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Cron Step',
          triggers: [{
            type: 'cron',
            cron: '0 0 * * *',
          }],
        },
      }

      expect(hasApiTrigger(step)).toBe(false)
      expect(hasEventTrigger(step)).toBe(false)
      expect(hasCronTrigger(step)).toBe(true)
      expect(hasStateTrigger(step)).toBe(false)
    })

    it('should correctly identify state triggers', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'State Step',
          triggers: [{
            type: 'state',
            key: 'test.key',
          }],
        },
      }

      expect(hasApiTrigger(step)).toBe(false)
      expect(hasEventTrigger(step)).toBe(false)
      expect(hasCronTrigger(step)).toBe(false)
      expect(hasStateTrigger(step)).toBe(true)
    })

    it('should handle steps with multiple trigger types', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Multi Trigger Step',
          triggers: [
            {
              type: 'api',
              path: '/api/test',
              method: 'POST',
            },
            {
              type: 'event',
              topic: 'test.event',
            },
          ],
        },
      }

      expect(hasApiTrigger(step)).toBe(true)
      expect(hasEventTrigger(step)).toBe(true)
      expect(hasCronTrigger(step)).toBe(false)
      expect(hasStateTrigger(step)).toBe(false)
    })

    it('should handle steps with no triggers (noop)', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Noop Step',
          triggers: [],
        },
      }

      expect(hasApiTrigger(step)).toBe(false)
      expect(hasEventTrigger(step)).toBe(false)
      expect(hasCronTrigger(step)).toBe(false)
      expect(hasStateTrigger(step)).toBe(false)
    })
  })

  describe('getTriggersByType', () => {
    it('should return correct API triggers', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Multi API Step',
          triggers: [
            {
              type: 'api',
              path: '/api/test1',
              method: 'POST',
            },
            {
              type: 'api',
              path: '/api/test2',
              method: 'GET',
            },
            {
              type: 'event',
              topic: 'test.event',
            },
          ],
        },
      }

      const apiTriggers = getTriggersByType(step, 'api')
      expect(apiTriggers).toHaveLength(2)
      expect(apiTriggers[0].path).toBe('/api/test1')
      expect(apiTriggers[1].path).toBe('/api/test2')
    })

    it('should return correct event triggers', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Multi Event Step',
          triggers: [
            {
              type: 'event',
              topic: 'test.event1',
            },
            {
              type: 'event',
              topic: 'test.event2',
            },
            {
              type: 'api',
              path: '/api/test',
              method: 'POST',
            },
          ],
        },
      }

      const eventTriggers = getTriggersByType(step, 'event')
      expect(eventTriggers).toHaveLength(2)
      expect(eventTriggers[0].topic).toBe('test.event1')
      expect(eventTriggers[1].topic).toBe('test.event2')
    })

    it('should return empty array for non-existent trigger type', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'API Only Step',
          triggers: [{
            type: 'api',
            path: '/api/test',
            method: 'POST',
          }],
        },
      }

      const cronTriggers = getTriggersByType(step, 'cron')
      expect(cronTriggers).toHaveLength(0)
    })
  })

  describe('Step Validation', () => {
    it('should validate valid API step', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Valid API Step',
          triggers: [{
            type: 'api',
            path: '/api/test',
            method: 'POST',
          }],
          path: '/api/test',
          method: 'POST',
          emits: ['test.event'],
        },
      }

      const result = validateStep(step)
      expect(result.success).toBe(true)
    })

    it('should validate valid event step', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Valid Event Step',
          triggers: [{
            type: 'event',
            topic: 'test.event',
          }],
          emits: ['test.processed'],
        },
      }

      const result = validateStep(step)
      expect(result.success).toBe(true)
    })

    it('should validate valid cron step', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Valid Cron Step',
          triggers: [{
            type: 'cron',
            cron: '0 0 * * *',
          }],
          cron: '0 0 * * *',
          emits: ['test.scheduled'],
        },
      }

      const result = validateStep(step)
      expect(result.success).toBe(true)
    })

    it('should validate valid noop step', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Valid Noop Step',
          triggers: [],
          virtualEmits: ['test.virtual'],
          virtualSubscribes: ['test.subscription'],
        },
      }

      const result = validateStep(step)
      expect(result.success).toBe(true)
    })

    it('should fail validation for API step without path/method', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Invalid API Step',
          triggers: [{
            type: 'api',
            path: '/api/test',
            method: 'POST',
          }],
          // Missing path and method in config
          emits: ['test.event'],
        },
      }

      const result = validateStep(step)
      expect(result.success).toBe(false)
      expect(result.error).toContain('API triggers require path and method')
    })

    it('should fail validation for cron step without cron expression', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Invalid Cron Step',
          triggers: [{
            type: 'cron',
            cron: '0 0 * * *',
          }],
          // Missing cron in config
          emits: ['test.scheduled'],
        },
      }

      const result = validateStep(step)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Cron triggers require cron expression')
    })

    it('should fail validation for step with invalid trigger type', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Invalid Step',
          triggers: [{
            type: 'invalid' as any,
            path: '/api/test',
            method: 'POST',
          }],
        },
      }

      const result = validateStep(step)
      expect(result.success).toBe(false)
    })

    it('should fail validation for step without required fields', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          // Missing name
          triggers: [],
        } as any,
      }

      const result = validateStep(step)
      expect(result.success).toBe(false)
    })
  })

  describe('Complex Trigger Scenarios', () => {
    it('should handle step with all trigger types', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Universal Step',
          triggers: [
            {
              type: 'api',
              path: '/api/test',
              method: 'POST',
            },
            {
              type: 'event',
              topic: 'test.event',
            },
            {
              type: 'cron',
              cron: '0 0 * * *',
            },
            {
              type: 'state',
              key: 'test.key',
            },
          ],
          path: '/api/test',
          method: 'POST',
          cron: '0 0 * * *',
          emits: ['test.processed'],
        },
      }

      expect(hasApiTrigger(step)).toBe(true)
      expect(hasEventTrigger(step)).toBe(true)
      expect(hasCronTrigger(step)).toBe(true)
      expect(hasStateTrigger(step)).toBe(true)

      const result = validateStep(step)
      expect(result.success).toBe(true)
    })

    it('should handle event trigger with condition', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Conditional Event Step',
          triggers: [{
            type: 'event',
            topic: 'test.event',
            condition: (data: any) => data.priority === 'high',
          }],
          emits: ['test.processed'],
        },
      }

      const eventTriggers = getTriggersByType(step, 'event')
      expect(eventTriggers).toHaveLength(1)
      expect(eventTriggers[0].condition).toBeDefined()
      expect(typeof eventTriggers[0].condition).toBe('function')
    })

    it('should handle state trigger with condition', () => {
      const step: Step = {
        filePath: '/test.step.ts',
        version: '1',
        config: {
          name: 'Conditional State Step',
          triggers: [{
            type: 'state',
            key: 'test.key',
            condition: (input: any, state: any) => state.get('test.key') === 'trigger',
          }],
          emits: ['test.processed'],
        },
      }

      const stateTriggers = getTriggersByType(step, 'state')
      expect(stateTriggers).toHaveLength(1)
      expect(stateTriggers[0].condition).toBeDefined()
      expect(typeof stateTriggers[0].condition).toBe('function')
    })
  })
})
