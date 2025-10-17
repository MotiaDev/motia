import { z } from 'zod'
import {
  AWS_LAMBDA_CPU_RATIO,
  AWS_LAMBDA_LIMITS,
  createInfrastructureSchema,
  getProportionalCpu,
  handlerSchema,
  infrastructureSchema,
  queueSchema,
} from '../infrastructure-validator'

describe('Infrastructure Config Validation', () => {
  describe('AWS_LAMBDA_LIMITS constants', () => {
    it('should have correct MIN_RAM_MB value', () => {
      expect(AWS_LAMBDA_LIMITS.MIN_RAM_MB).toBe(128)
    })

    it('should have correct MAX_RAM_MB value', () => {
      expect(AWS_LAMBDA_LIMITS.MAX_RAM_MB).toBe(10240)
    })

    it('should have correct MIN_TIMEOUT_SECONDS value', () => {
      expect(AWS_LAMBDA_LIMITS.MIN_TIMEOUT_SECONDS).toBe(1)
    })

    it('should have correct MAX_TIMEOUT_SECONDS value', () => {
      expect(AWS_LAMBDA_LIMITS.MAX_TIMEOUT_SECONDS).toBe(900)
    })
  })

  describe('AWS_LAMBDA_CPU_RATIO mapping', () => {
    it('should have correct mappings for standard RAM values', () => {
      expect(AWS_LAMBDA_CPU_RATIO[128]).toBe(0.0625)
      expect(AWS_LAMBDA_CPU_RATIO[256]).toBe(0.125)
      expect(AWS_LAMBDA_CPU_RATIO[512]).toBe(0.25)
      expect(AWS_LAMBDA_CPU_RATIO[1024]).toBe(0.5)
      expect(AWS_LAMBDA_CPU_RATIO[2048]).toBe(1)
      expect(AWS_LAMBDA_CPU_RATIO[4096]).toBe(2)
      expect(AWS_LAMBDA_CPU_RATIO[8192]).toBe(4)
      expect(AWS_LAMBDA_CPU_RATIO[10240]).toBe(5)
    })

    it('should have all 14 standard RAM to CPU mappings', () => {
      const expectedMappings = {
        128: 0.0625,
        256: 0.125,
        512: 0.25,
        1024: 0.5,
        1536: 0.75,
        2048: 1,
        3008: 1.5,
        4096: 2,
        5120: 2.5,
        6144: 3,
        7168: 3.5,
        8192: 4,
        9216: 4.5,
        10240: 5,
      }
      expect(AWS_LAMBDA_CPU_RATIO).toEqual(expectedMappings)
    })
  })

  describe('getProportionalCpu()', () => {
    it('should return exact CPU for standard RAM values', () => {
      expect(getProportionalCpu(128)).toBe(0.0625)
      expect(getProportionalCpu(1024)).toBe(0.5)
      expect(getProportionalCpu(2048)).toBe(1)
      expect(getProportionalCpu(10240)).toBe(5)
    })

    it('should interpolate CPU for non-standard RAM values', () => {
      const cpu = getProportionalCpu(1500)
      expect(cpu).toBeGreaterThan(0.5)
      expect(cpu).toBeLessThan(0.75)
    })

    it('should interpolate correctly between 2048 and 3008', () => {
      const cpu = getProportionalCpu(2500)
      expect(cpu).toBeGreaterThan(1)
      expect(cpu).toBeLessThan(1.5)
      expect(cpu).toBeCloseTo(1.234375, 2)
    })

    it('should return min CPU for RAM below minimum', () => {
      const cpu = getProportionalCpu(100)
      expect(cpu).toBe(0.0625)
    })

    it('should return max CPU for RAM above maximum', () => {
      const cpu = getProportionalCpu(11000)
      expect(cpu).toBe(5)
    })

    it('should handle edge case at exact lower bound', () => {
      expect(getProportionalCpu(128)).toBe(0.0625)
    })

    it('should handle edge case at exact upper bound', () => {
      expect(getProportionalCpu(10240)).toBe(5)
    })
  })

  describe('handlerSchema validation', () => {
    it('should accept valid handler configuration', () => {
      const validConfig = {
        ram: 2048,
        timeout: 30,
        cpu: 1,
      }

      expect(() => handlerSchema.parse(validConfig)).not.toThrow()
    })

    it('should reject RAM below minimum', () => {
      const invalidConfig = {
        ram: 64,
        timeout: 30,
      }

      expect(() => handlerSchema.parse(invalidConfig)).toThrow('RAM must be at least 128 MB')
    })

    it('should reject RAM above maximum', () => {
      const invalidConfig = {
        ram: 20000,
        timeout: 30,
      }

      expect(() => handlerSchema.parse(invalidConfig)).toThrow('RAM cannot exceed 10240 MB')
    })

    it('should reject timeout below minimum', () => {
      const invalidConfig = {
        ram: 1024,
        timeout: 0,
      }

      expect(() => handlerSchema.parse(invalidConfig)).toThrow('Timeout must be at least 1s')
    })

    it('should reject timeout above maximum', () => {
      const invalidConfig = {
        ram: 1024,
        timeout: 1000,
      }

      expect(() => handlerSchema.parse(invalidConfig)).toThrow('Timeout cannot exceed 900s')
    })

    it('should accept optional cpu field', () => {
      const configWithoutCpu = {
        ram: 1024,
        timeout: 30,
      }

      expect(() => handlerSchema.parse(configWithoutCpu)).not.toThrow()
    })
  })

  describe('handlerSchema CPU-RAM proportionality validation', () => {
    it('should accept CPU proportional to RAM within tolerance', () => {
      const validConfig = {
        ram: 2048,
        timeout: 30,
        cpu: 1,
      }

      expect(() => handlerSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept CPU within 0.1 tolerance of proportional value', () => {
      const validConfig = {
        ram: 2048,
        timeout: 30,
        cpu: 1.09,
      }

      expect(() => handlerSchema.parse(validConfig)).not.toThrow()
    })

    it('should reject CPU not proportional to RAM', () => {
      const invalidConfig = {
        ram: 2048,
        timeout: 30,
        cpu: 3,
      }

      expect(() => handlerSchema.parse(invalidConfig)).toThrow('CPU (3 vCPU) is not proportional to RAM (2048 MB)')
    })

    it('should not validate CPU when it is not provided', () => {
      const configWithoutCpu = {
        ram: 2048,
        timeout: 30,
      }

      expect(() => handlerSchema.parse(configWithoutCpu)).not.toThrow()
    })
  })

  describe('queueSchema validation', () => {
    it('should accept valid queue configuration', () => {
      const validConfig = {
        type: 'fifo' as const,
        visibilityTimeout: 60,
        messageGroupId: 'traceId',
        maxRetries: 5,
      }

      expect(() => queueSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept standard queue type', () => {
      const validConfig = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: 3,
      }

      expect(() => queueSchema.parse(validConfig)).not.toThrow()
    })

    it('should reject invalid queue type', () => {
      const invalidConfig = {
        type: 'invalid',
        visibilityTimeout: 60,
        maxRetries: 3,
      }

      expect(() => queueSchema.parse(invalidConfig)).toThrow()
    })

    it('should reject negative maxRetries', () => {
      const invalidConfig = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: -1,
      }

      expect(() => queueSchema.parse(invalidConfig)).toThrow('maxRetries cannot be negative')
    })

    it('should accept nullable messageGroupId', () => {
      const validConfig = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        messageGroupId: null,
        maxRetries: 3,
      }

      expect(() => queueSchema.parse(validConfig)).not.toThrow()
    })
  })

  describe('infrastructureSchema validation', () => {
    it('should accept valid infrastructure configuration', () => {
      const validConfig = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept optional handler config', () => {
      const validConfig = {
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept optional queue config', () => {
      const validConfig = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept empty infrastructure config', () => {
      const validConfig = {}

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept partial handler config', () => {
      const validConfig = {
        handler: {
          ram: 2048,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept partial queue config', () => {
      const validConfig = {
        queue: {
          type: 'standard' as const,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })
  })

  describe('infrastructureSchema visibilityTimeout validation', () => {
    it('should reject when visibilityTimeout <= handler.timeout', () => {
      const invalidConfig = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 30,
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(invalidConfig)).toThrow(
        'Visibility timeout (30s) must be greater than handler timeout (30s)',
      )
    })

    it('should accept when visibilityTimeout > handler.timeout', () => {
      const validConfig = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 31,
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should skip validation when handler timeout is not provided', () => {
      const validConfig = {
        handler: {
          ram: 2048,
        },
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 30,
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should skip validation when queue visibilityTimeout is not provided', () => {
      const validConfig = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard' as const,
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })
  })

  describe('infrastructureSchema FIFO requires messageGroupId', () => {
    it('should reject FIFO queue without messageGroupId', () => {
      const invalidConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      }

      try {
        infrastructureSchema.parse(invalidConfig)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        const zodError = error as z.ZodError
        expect(zodError.errors[0].message).toContain('messageGroupId is required when queue type is "fifo"')
      }
    })

    it('should accept FIFO queue with messageGroupId', () => {
      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'traceId',
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })

    it('should accept standard queue without messageGroupId', () => {
      const validConfig = {
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      }

      expect(() => infrastructureSchema.parse(validConfig)).not.toThrow()
    })
  })

  describe('createInfrastructureSchema messageGroupId validation', () => {
    it('should accept simple messageGroupId that exists in input schema', () => {
      const inputSchema = z.object({
        traceId: z.string(),
        userId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'traceId',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should reject messageGroupId with dots (nested path)', () => {
      const inputSchema = z.object({
        user: z.object({
          id: z.string(),
        }),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const invalidConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'user.id',
          maxRetries: 3,
        },
      }

      try {
        schema.parse(invalidConfig)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        const zodError = error as z.ZodError
        expect(zodError.errors[0].message).toContain('messageGroupId "user.id" must be a simple field path')
      }
    })

    it('should reject messageGroupId with brackets (template expression)', () => {
      const inputSchema = z.object({
        items: z.array(z.string()),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const invalidConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'items[0]',
          maxRetries: 3,
        },
      }

      try {
        schema.parse(invalidConfig)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        const zodError = error as z.ZodError
        expect(zodError.errors[0].message).toContain('messageGroupId "items[0]" must be a simple field path')
      }
    })

    it('should reject messageGroupId that does not exist in input schema', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const invalidConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'userId',
          maxRetries: 3,
        },
      }

      try {
        schema.parse(invalidConfig)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        const zodError = error as z.ZodError
        expect(zodError.errors[0].message).toContain('messageGroupId "userId" does not exist in step\'s input schema')
      }
    })

    it('should show error when messageGroupId is provided but no input schema', () => {
      const schema = createInfrastructureSchema()

      const invalidConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'userId',
          maxRetries: 3,
        },
      }

      try {
        schema.parse(invalidConfig)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        const zodError = error as z.ZodError
        expect(zodError.errors[0].message).toContain(
          'Cannot validate messageGroupId "userId" - step has no input schema defined',
        )
      }
    })

    it('should skip validation when messageGroupId is traceId', () => {
      const schema = createInfrastructureSchema()

      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'traceId',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should skip validation when messageGroupId is not provided', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should skip validation when messageGroupId is null', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'standard' as const,
          visibilityTimeout: 60,
          messageGroupId: null,
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })
  })

  describe('Handler Schema Edge Cases', () => {
    it('should accept RAM at exact minimum boundary', () => {
      const config = {
        ram: 128,
        timeout: 30,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })

    it('should accept RAM at exact maximum boundary', () => {
      const config = {
        ram: 10240,
        timeout: 30,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })

    it('should accept timeout at exact minimum boundary', () => {
      const config = {
        ram: 1024,
        timeout: 1,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })

    it('should accept timeout at exact maximum boundary', () => {
      const config = {
        ram: 1024,
        timeout: 900,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })

    it('should accept CPU within tolerance of proportional value', () => {
      const config = {
        ram: 2048,
        timeout: 30,
        cpu: 1.09,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })

    it('should accept CPU below proportional value within tolerance', () => {
      const config = {
        ram: 2048,
        timeout: 30,
        cpu: 0.91,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })

    it('should reject CPU outside tolerance of proportional value', () => {
      const config = {
        ram: 2048,
        timeout: 30,
        cpu: 1.11,
      }

      expect(() => handlerSchema.parse(config)).toThrow()
    })

    it('should handle fractional RAM values', () => {
      const config = {
        ram: 1536.5,
        timeout: 30,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })

    it('should handle fractional timeout values', () => {
      const config = {
        ram: 1024,
        timeout: 30.5,
      }

      expect(() => handlerSchema.parse(config)).not.toThrow()
    })
  })

  describe('Queue Schema Edge Cases', () => {
    it('should accept delaySeconds at minimum boundary', () => {
      const config = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: 0,
      }

      expect(() => queueSchema.parse(config)).not.toThrow()
    })

    it('should accept delaySeconds at maximum boundary', () => {
      const config = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: 900,
      }

      expect(() => queueSchema.parse(config)).not.toThrow()
    })

    it('should accept maxRetries = 0', () => {
      const config = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: 0,
        delaySeconds: 0,
      }

      expect(() => queueSchema.parse(config)).not.toThrow()
    })

    it('should accept messageGroupId with special characters', () => {
      const config = {
        type: 'fifo' as const,
        visibilityTimeout: 60,
        messageGroupId: 'user_id-123',
        maxRetries: 3,
      }

      expect(() => queueSchema.parse(config)).not.toThrow()
    })

    it('should accept very long messageGroupId', () => {
      const config = {
        type: 'fifo' as const,
        visibilityTimeout: 60,
        messageGroupId: 'a'.repeat(1000),
        maxRetries: 3,
      }

      expect(() => queueSchema.parse(config)).not.toThrow()
    })

    it('should reject delaySeconds slightly below 0', () => {
      const config = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: -0.1,
      }

      expect(() => queueSchema.parse(config)).toThrow()
    })

    it('should reject delaySeconds slightly above 900', () => {
      const config = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: 900.1,
      }

      expect(() => queueSchema.parse(config)).toThrow()
    })

    it('should handle missing optional delaySeconds', () => {
      const config = {
        type: 'standard' as const,
        visibilityTimeout: 60,
        maxRetries: 3,
      }

      expect(() => queueSchema.parse(config)).not.toThrow()
    })
  })

  describe('createInfrastructureSchema with Complex Input Schemas', () => {
    it('should validate messageGroupId against nested object schema', () => {
      const inputSchema = z.object({
        user: z.object({
          id: z.string(),
          name: z.string(),
        }),
        traceId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'traceId',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should validate messageGroupId against schema with arrays', () => {
      const inputSchema = z.object({
        userId: z.string(),
        tags: z.array(z.string()),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'userId',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should handle input schema with optional fields', () => {
      const inputSchema = z.object({
        userId: z.string().optional(),
        traceId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'userId',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should handle input schema with union types', () => {
      const inputSchema = z.object({
        id: z.union([z.string(), z.number()]),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'id',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should handle array input schema', () => {
      const inputSchema = z.array(z.object({ id: z.string() }))

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'traceId',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should handle empty object input schema', () => {
      const inputSchema = z.object({})

      const schema = createInfrastructureSchema(inputSchema)

      const invalidConfig = {
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 60,
          messageGroupId: 'userId',
          maxRetries: 3,
        },
      }

      expect(() => schema.parse(invalidConfig)).toThrow()
    })
  })

  describe('Infrastructure Schema Combined Validations', () => {
    it('should validate all fields together in complete config', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const validConfig = {
        handler: {
          ram: 2048,
          timeout: 30,
          cpu: 1,
        },
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 31,
          messageGroupId: 'traceId',
          maxRetries: 5,
          delaySeconds: 10,
        },
      }

      expect(() => schema.parse(validConfig)).not.toThrow()
    })

    it('should reject config with multiple validation errors', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const schema = createInfrastructureSchema(inputSchema)

      const invalidConfig = {
        handler: {
          ram: 64,
          timeout: 1000,
          cpu: 10,
        },
        queue: {
          type: 'fifo' as const,
          visibilityTimeout: 30,
          messageGroupId: 'userId',
          maxRetries: -1,
          delaySeconds: 1000,
        },
      }

      try {
        schema.parse(invalidConfig)
        fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        const zodError = error as z.ZodError
        expect(zodError.errors.length).toBeGreaterThan(1)
      }
    })

    it('should accept minimal valid config', () => {
      const config = {
        handler: {
          ram: 128,
        },
      }

      expect(() => infrastructureSchema.parse(config)).not.toThrow()
    })

    it('should accept config with only queue type specified', () => {
      const config = {
        queue: {
          type: 'standard' as const,
        },
      }

      expect(() => infrastructureSchema.parse(config)).not.toThrow()
    })
  })
})
