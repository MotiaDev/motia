import { jest } from '@jest/globals'
import { z } from 'zod'
import { validateStepsConfig } from '../build-validation'
import type { Builder, BuildStepConfig } from '../builder'

describe('Infrastructure Validation in Build Process', () => {
  function createMockBuilder(stepsConfig: Record<string, BuildStepConfig>): Builder {
    return {
      stepsConfig,
      projectDir: '/mock/project',
      streamsConfig: {},
      routersConfig: {},
      stepUncompressedSizes: new Map(),
      stepCompressedSizes: new Map(),
      routerUncompressedSizes: new Map(),
      routerCompressedSizes: new Map(),
      modulegraphInstalled: false,
      registerBuilder: jest.fn(),
      registerStateStream: jest.fn(),
      registerStep: jest.fn(),
      recordStepSize: jest.fn(),
      buildStep: jest.fn(),
      buildApiSteps: jest.fn(),
    } as unknown as Builder
  }

  function createMockStep(
    name: string,
    configType: 'event' | 'api' | 'cron',
    infrastructure?: unknown,
    input?: unknown,
  ): BuildStepConfig {
    return {
      type: 'node',
      entrypointPath: `/mock/steps/${name}.step.ts`,
      filePath: `/mock/project/steps/${name}.step.ts`,
      config: {
        type: configType,
        name,
        description: `Test ${name}`,
        infrastructure,
        input,
        ...(configType === 'event' && {
          subscribes: ['test.event'],
          emits: [],
        }),
        ...(configType === 'api' && {
          path: `/test/${name}`,
          method: 'GET',
          emits: [],
        }),
        ...(configType === 'cron' && {
          cron: '0 0 * * *',
          emits: [],
        }),
      } as BuildStepConfig['config'],
    }
  }

  describe('Valid Infrastructure Configurations', () => {
    it('should accept valid handler configuration', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should accept valid handler with CPU configuration', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
          cpu: 1,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should accept valid queue configuration', () => {
      const step = createMockStep('testStep', 'event', {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should accept valid FIFO queue', () => {
      const inputSchema = z.object({
        traceId: z.string(),
        userId: z.string(),
      })

      const step = createMockStep(
        'testStep',
        'event',
        {
          queue: {
            type: 'fifo',
            visibilityTimeout: 60,
            maxRetries: 3,
          },
        },
        inputSchema,
      )

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should accept complete infrastructure configuration', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const step = createMockStep(
        'testStep',
        'event',
        {
          handler: {
            ram: 2048,
            timeout: 30,
            cpu: 1,
          },
          queue: {
            type: 'fifo',
            visibilityTimeout: 31,
            maxRetries: 5,
          },
        },
        inputSchema,
      )

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should skip validation for steps without infrastructure config', () => {
      const step = createMockStep('testStep', 'event')

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })
  })

  describe('Invalid Handler Configurations', () => {
    it('should reject RAM below minimum', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('RAM must be at least 128 MB')
    })

    it('should reject RAM above maximum', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 20000,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('RAM cannot exceed 10240 MB')
    })

    it('should reject timeout below minimum', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 1024,
          timeout: 0,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('Timeout must be at least 1s')
    })

    it('should reject timeout above maximum', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 1024,
          timeout: 1000,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('Timeout cannot exceed 900s')
    })

    it('should reject CPU not proportional to RAM', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
          cpu: 3,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('CPU')
      expect(errors[0].message).toContain('not proportional to RAM')
    })
  })

  describe('Invalid Queue Configurations', () => {
    it('should reject negative maxRetries', () => {
      const step = createMockStep('testStep', 'event', {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: -1,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('maxRetries cannot be negative')
    })
  })

  describe('Cross-Field Validation', () => {
    it('should reject visibilityTimeout <= handler.timeout', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard',
          visibilityTimeout: 30,
          maxRetries: 3,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('Visibility timeout')
      expect(errors[0].message).toContain('must be greater than handler timeout')
    })

    it('should accept visibilityTimeout > handler.timeout', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard',
          visibilityTimeout: 31,
          maxRetries: 3,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })
  })

  describe('Queue Config on Non-Event Steps', () => {
    it('should not warn when queue config is present on Event step', () => {
      const step = createMockStep('testStep', 'event', {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { warnings } = validateStepsConfig(builder)

      const queueWarnings = warnings.filter((w) => w.message.includes('Queue configuration'))
      expect(queueWarnings).toHaveLength(0)
    })
  })

  describe('Multiple Steps with Infrastructure Config', () => {
    it('should validate multiple steps independently', () => {
      const validStep = createMockStep('validStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      })

      const invalidStep = createMockStep('invalidStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({
        validStep,
        invalidStep,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some((e) => e.message.includes('invalidStep'))).toBe(true)
    })

    it('should collect all validation errors from multiple steps', () => {
      const step1 = createMockStep('step1', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const step2 = createMockStep('step2', 'event', {
        handler: {
          ram: 2048,
          timeout: 1000,
        },
      })

      const builder = createMockBuilder({
        step1,
        step2,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThanOrEqual(2)
      expect(errors.some((e) => e.message.includes('step1'))).toBe(true)
      expect(errors.some((e) => e.message.includes('step2'))).toBe(true)
    })
  })

  describe('Error Message Formatting', () => {
    it('should include step name in error messages', () => {
      const step = createMockStep('myTestStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ myTestStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('myTestStep')
    })

    it('should include relative file path', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].relativePath).toContain('steps/testStep.step.ts')
    })

    it('should include error path and message', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('handler.ram')
      expect(errors[0].message).toContain('RAM must be at least 128 MB')
    })
  })

  describe('Build Validation Edge Cases', () => {
    it('should validate multiple steps with same infrastructure config', () => {
      const infrastructure = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard',
          maxRetries: 3,
          visibilityTimeout: 60,
        },
      }

      const step1 = createMockStep('step1', 'event', infrastructure)
      const step2 = createMockStep('step2', 'event', infrastructure)
      const step3 = createMockStep('step3', 'event', infrastructure)

      const builder = createMockBuilder({
        step1,
        step2,
        step3,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should validate steps with partial infrastructure configs', () => {
      const step1 = createMockStep('step1', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      })

      const step2 = createMockStep('step2', 'event', {
        queue: {
          type: 'standard',
          maxRetries: 3,
          visibilityTimeout: 60,
        },
      })

      const builder = createMockBuilder({
        step1,
        step2,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should ignore infrastructure config on API steps', () => {
      const apiStep = createMockStep('apiStep', 'api', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ apiStep })
      const { errors, warnings } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })

    it('should ignore infrastructure config on Cron steps', () => {
      const cronStep = createMockStep('cronStep', 'cron', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ cronStep })
      const { errors, warnings } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
      expect(warnings).toHaveLength(0)
    })

    it('should aggregate errors from multiple invalid steps', () => {
      const step1 = createMockStep('step1', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const step2 = createMockStep('step2', 'event', {
        handler: {
          ram: 2048,
          timeout: 1000,
        },
      })

      const step3 = createMockStep('step3', 'event', {
        queue: {
          type: 'standard',
          maxRetries: -1,
          visibilityTimeout: 60,
        },
      })

      const builder = createMockBuilder({
        step1,
        step2,
        step3,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThanOrEqual(3)
      expect(errors.some((e) => e.message.includes('step1'))).toBe(true)
      expect(errors.some((e) => e.message.includes('step2'))).toBe(true)
      expect(errors.some((e) => e.message.includes('step3'))).toBe(true)
    })

    it('should include step name in error messages', () => {
      const step = createMockStep('myCustomStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ myCustomStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('myCustomStep')
    })

    it('should include relative file path in errors', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].relativePath).toContain('steps/testStep.step.ts')
    })

    it('should validate event steps while ignoring non-event steps', () => {
      const validEventStep = createMockStep('validEvent', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      })

      const invalidEventStep = createMockStep('invalidEvent', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const apiStep = createMockStep('apiStep', 'api', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const cronStep = createMockStep('cronStep', 'cron', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({
        validEventStep,
        invalidEventStep,
        apiStep,
        cronStep,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.every((e) => e.message.includes('invalidEvent'))).toBe(true)
      expect(errors.some((e) => e.message.includes('apiStep'))).toBe(false)
      expect(errors.some((e) => e.message.includes('cronStep'))).toBe(false)
    })

    it('should handle empty infrastructure object gracefully', () => {
      const step = createMockStep('emptyInfraStep', 'event', {})

      const builder = createMockBuilder({ emptyInfraStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should validate steps with only handler config', () => {
      const step = createMockStep('handlerOnlyStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ handlerOnlyStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should validate steps with only queue config', () => {
      const step = createMockStep('queueOnlyStep', 'event', {
        queue: {
          type: 'standard',
          maxRetries: 3,
          visibilityTimeout: 60,
        },
      })

      const builder = createMockBuilder({ queueOnlyStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should format error messages consistently', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('Infrastructure configuration error')
      expect(errors[0].message).toContain('testStep')
      expect(errors[0].message).toContain('➜')
    })

    it('should handle multiple validation errors for single step', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const step = createMockStep(
        'multiErrorStep',
        'event',
        {
          handler: {
            ram: 64,
            timeout: 1000,
            cpu: 10,
          },
          queue: {
            type: 'fifo',
            visibilityTimeout: 30,
            maxRetries: -1,
          },
        },
        inputSchema,
      )

      const builder = createMockBuilder({ multiErrorStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(1)
      expect(errors.every((e) => e.message.includes('multiErrorStep'))).toBe(true)
    })
  })
})
