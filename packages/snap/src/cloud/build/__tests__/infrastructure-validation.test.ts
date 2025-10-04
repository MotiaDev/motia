import { validateStepsConfig } from '../build-validation'
import { Builder, BuildStepConfig } from '../builder'
import { z } from '@motiadev/core/node_modules/zod'

describe('Infrastructure Validation in Build Process', () => {
  function createMockBuilder(stepsConfig: Record<string, BuildStepConfig>): Builder {
    return {
      stepsConfig,
      projectDir: '/mock/project',
      stepUncompressedSizes: new Map(),
      stepCompressedSizes: new Map(),
      routerUncompressedSizes: new Map(),
      routerCompressedSizes: new Map(),
    } as any
  }

  function createMockStep(
    name: string,
    configType: 'event' | 'api' | 'cron',
    infrastructure?: any,
    input?: any
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
      } as any,
    }
  }

  describe('Valid Infrastructure Configurations', () => {
    it('should accept valid handler configuration', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
          machineType: 'cpu',
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
          machineType: 'cpu',
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
          retryStrategy: 'exponential',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })

    it('should accept valid FIFO queue with messageGroupId', () => {
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
            messageGroupId: 'traceId',
            maxRetries: 3,
            retryStrategy: 'none',
          },
        },
        inputSchema
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
            machineType: 'cpu',
          },
          queue: {
            type: 'fifo',
            visibilityTimeout: 31,
            messageGroupId: 'traceId',
            maxRetries: 5,
            retryStrategy: 'exponential',
          },
        },
        inputSchema
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
          machineType: 'cpu',
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
          machineType: 'cpu',
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
          machineType: 'cpu',
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
          machineType: 'cpu',
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
          machineType: 'cpu',
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
          retryStrategy: 'none',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('maxRetries cannot be negative')
    })

    it('should reject FIFO queue without messageGroupId', () => {
      const step = createMockStep('testStep', 'event', {
        queue: {
          type: 'fifo',
          visibilityTimeout: 60,
          maxRetries: 3,
          retryStrategy: 'none',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('messageGroupId is required when queue type is "fifo"')
    })
  })

  describe('Cross-Field Validation', () => {
    it('should reject visibilityTimeout <= handler.timeout', () => {
      const step = createMockStep('testStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
          machineType: 'cpu',
        },
        queue: {
          type: 'standard',
          visibilityTimeout: 30,
          maxRetries: 3,
          retryStrategy: 'none',
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
          machineType: 'cpu',
        },
        queue: {
          type: 'standard',
          visibilityTimeout: 31,
          maxRetries: 3,
          retryStrategy: 'none',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors).toHaveLength(0)
    })
  })

  describe('MessageGroupId Validation', () => {
    it('should reject messageGroupId with dots (nested path)', () => {
      const inputSchema = z.object({
        user: z.object({
          id: z.string(),
        }),
      })

      const step = createMockStep(
        'testStep',
        'event',
        {
          queue: {
            type: 'fifo',
            visibilityTimeout: 60,
            messageGroupId: 'user.id',
            maxRetries: 3,
            retryStrategy: 'none',
          },
        },
        inputSchema
      )

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('messageGroupId')
      expect(errors[0].message).toContain('must be a simple field path')
    })

    it('should reject messageGroupId with brackets (template expression)', () => {
      const inputSchema = z.object({
        items: z.array(z.string()),
      })

      const step = createMockStep(
        'testStep',
        'event',
        {
          queue: {
            type: 'fifo',
            visibilityTimeout: 60,
            messageGroupId: 'items[0]',
            maxRetries: 3,
            retryStrategy: 'none',
          },
        },
        inputSchema
      )

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('messageGroupId')
      expect(errors[0].message).toContain('must be a simple field path')
    })

    it('should reject messageGroupId that does not exist in input schema', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const step = createMockStep(
        'testStep',
        'event',
        {
          queue: {
            type: 'fifo',
            visibilityTimeout: 60,
            messageGroupId: 'userId',
            maxRetries: 3,
            retryStrategy: 'none',
          },
        },
        inputSchema
      )

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('messageGroupId')
      expect(errors[0].message).toContain('does not exist in step\'s input schema')
    })

    it('should show error when messageGroupId is provided but no input schema', () => {
      const step = createMockStep('testStep', 'event', {
        queue: {
          type: 'fifo',
          visibilityTimeout: 60,
          messageGroupId: 'traceId',
          maxRetries: 3,
          retryStrategy: 'none',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('Cannot validate messageGroupId')
      expect(errors[0].message).toContain('step has no input schema defined')
    })
  })

  describe('Queue Config on Non-Event Steps', () => {
    it('should warn when queue config is present on API step', () => {
      const step = createMockStep('testStep', 'api', {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: 3,
          retryStrategy: 'none',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { warnings } = validateStepsConfig(builder)

      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0].message).toContain('Queue configuration is only applicable to Event steps')
    })

    it('should warn when queue config is present on Cron step', () => {
      const step = createMockStep('testStep', 'cron', {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: 3,
          retryStrategy: 'none',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { warnings } = validateStepsConfig(builder)

      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0].message).toContain('Queue configuration is only applicable to Event steps')
    })

    it('should not warn when queue config is present on Event step', () => {
      const step = createMockStep('testStep', 'event', {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: 3,
          retryStrategy: 'none',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { warnings } = validateStepsConfig(builder)

      const queueWarnings = warnings.filter(w => w.message.includes('Queue configuration'))
      expect(queueWarnings).toHaveLength(0)
    })
  })

  describe('Multiple Steps with Infrastructure Config', () => {
    it('should validate multiple steps independently', () => {
      const validStep = createMockStep('validStep', 'event', {
        handler: {
          ram: 2048,
          timeout: 30,
          machineType: 'cpu',
        },
      })

      const invalidStep = createMockStep('invalidStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
          machineType: 'cpu',
        },
      })

      const builder = createMockBuilder({
        validStep,
        invalidStep,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.message.includes('invalidStep'))).toBe(true)
    })

    it('should collect all validation errors from multiple steps', () => {
      const step1 = createMockStep('step1', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
          machineType: 'cpu',
        },
      })

      const step2 = createMockStep('step2', 'event', {
        handler: {
          ram: 2048,
          timeout: 1000,
          machineType: 'cpu',
        },
      })

      const builder = createMockBuilder({
        step1,
        step2,
      })

      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThanOrEqual(2)
      expect(errors.some(e => e.message.includes('step1'))).toBe(true)
      expect(errors.some(e => e.message.includes('step2'))).toBe(true)
    })
  })

  describe('Error Message Formatting', () => {
    it('should include step name in error messages', () => {
      const step = createMockStep('myTestStep', 'event', {
        handler: {
          ram: 64,
          timeout: 30,
          machineType: 'cpu',
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
          machineType: 'cpu',
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
          machineType: 'cpu',
        },
      })

      const builder = createMockBuilder({ testStep: step })
      const { errors } = validateStepsConfig(builder)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].message).toContain('handler.ram')
      expect(errors[0].message).toContain('RAM must be at least 128 MB')
    })
  })
})

