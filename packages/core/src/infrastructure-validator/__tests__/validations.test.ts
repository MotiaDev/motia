import { z } from 'zod'
import { validateQueueConfig, validateInfrastructureConfig } from '../validations'

describe('Infrastructure Runtime Validations', () => {
  describe('validateQueueConfig', () => {
    it('should accept valid standard queue config', () => {
      const queueConfig = {
        type: 'standard',
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: 0,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(true)
    })

    it('should accept valid FIFO queue config with messageGroupId', () => {
      const queueConfig = {
        type: 'fifo',
        visibilityTimeout: 60,
        messageGroupId: 'traceId',
        maxRetries: 3,
        delaySeconds: 0,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(true)
    })

    it('should reject invalid queue type', () => {
      const queueConfig = {
        type: 'invalid',
        visibilityTimeout: 60,
        maxRetries: 3,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].path).toBe('type')
      }
    })

    it('should reject negative maxRetries', () => {
      const queueConfig = {
        type: 'standard',
        visibilityTimeout: 60,
        maxRetries: -1,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('maxRetries cannot be negative')
      }
    })

    it('should accept FIFO queue configuration (messageGroupId validation is at infrastructure level)', () => {
      const queueConfig = {
        type: 'fifo',
        visibilityTimeout: 60,
        maxRetries: 3,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(true)
    })

    it('should reject negative delaySeconds', () => {
      const queueConfig = {
        type: 'standard',
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: -5,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('delaySeconds cannot be negative')
      }
    })

    it('should reject delaySeconds exceeding 900', () => {
      const queueConfig = {
        type: 'standard',
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: 1000,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('delaySeconds cannot exceed 900 seconds')
      }
    })

    it('should accept delaySeconds at boundaries', () => {
      const queueConfigMin = {
        type: 'standard',
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: 0,
      }
      const queueConfigMax = {
        type: 'standard',
        visibilityTimeout: 60,
        maxRetries: 3,
        delaySeconds: 900,
      }

      expect(validateQueueConfig(queueConfigMin).success).toBe(true)
      expect(validateQueueConfig(queueConfigMax).success).toBe(true)
    })

    it('should return proper error structure with path and message', () => {
      const queueConfig = {
        type: 'standard',
        visibilityTimeout: 60,
        maxRetries: -1,
      }

      const result = validateQueueConfig(queueConfig)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toHaveLength(1)
        expect(result.errors![0]).toHaveProperty('path')
        expect(result.errors![0]).toHaveProperty('message')
        expect(typeof result.errors![0].path).toBe('string')
        expect(typeof result.errors![0].message).toBe('string')
      }
    })

    it('should handle unexpected validation errors gracefully', () => {
      const invalidInput = null

      const result = validateQueueConfig(invalidInput)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
      }
    })
  })

  describe('validateInfrastructureConfig', () => {
    it('should accept valid complete infrastructure', () => {
      const infrastructure = {
        handler: {
          ram: 2048,
          timeout: 30,
          cpu: 1,
        },
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(true)
    })

    it('should accept valid partial infrastructure with handler only', () => {
      const infrastructure = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(true)
    })

    it('should accept valid partial infrastructure with queue only', () => {
      const infrastructure = {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: 3,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(true)
    })

    it('should reject invalid handler config with RAM out of bounds', () => {
      const infrastructure = {
        handler: {
          ram: 64,
          timeout: 30,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('RAM must be at least 128 MB')
      }
    })

    it('should reject invalid handler config with timeout out of bounds', () => {
      const infrastructure = {
        handler: {
          ram: 1024,
          timeout: 1000,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('Timeout cannot exceed 900s')
      }
    })

    it('should reject invalid handler config with CPU not proportional', () => {
      const infrastructure = {
        handler: {
          ram: 2048,
          timeout: 30,
          cpu: 5,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('CPU')
        expect(result.errors![0].message).toContain('not proportional')
      }
    })

    it('should reject invalid queue config', () => {
      const infrastructure = {
        queue: {
          type: 'standard',
          visibilityTimeout: 60,
          maxRetries: -1,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('maxRetries cannot be negative')
      }
    })

    it('should reject when visibilityTimeout <= handler.timeout', () => {
      const infrastructure = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard',
          visibilityTimeout: 30,
          maxRetries: 3,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain('Visibility timeout')
        expect(result.errors![0].message).toContain('must be greater than handler timeout')
      }
    })

    it('should return proper error structure', () => {
      const infrastructure = {
        handler: {
          ram: 64,
          timeout: 30,
        },
      }

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors!.length).toBeGreaterThan(0)
        expect(result.errors![0]).toHaveProperty('path')
        expect(result.errors![0]).toHaveProperty('message')
      }
    })

    it('should validate messageGroupId against input schema', () => {
      const inputSchema = z.object({
        traceId: z.string(),
        userId: z.string(),
      })

      const infrastructure = {
        queue: {
          type: 'fifo',
          visibilityTimeout: 60,
          messageGroupId: 'userId',
          maxRetries: 3,
        },
      }

      const result = validateInfrastructureConfig(infrastructure, inputSchema)

      expect(result.success).toBe(true)
    })

    it('should reject messageGroupId not in input schema', () => {
      const inputSchema = z.object({
        traceId: z.string(),
      })

      const infrastructure = {
        queue: {
          type: 'fifo',
          visibilityTimeout: 60,
          messageGroupId: 'userId',
          maxRetries: 3,
        },
      }

      const result = validateInfrastructureConfig(infrastructure, inputSchema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
        expect(result.errors![0].message).toContain("does not exist in step's input schema")
      }
    })

    it('should handle empty infrastructure object', () => {
      const infrastructure = {}

      const result = validateInfrastructureConfig(infrastructure)

      expect(result.success).toBe(true)
    })

    it('should handle unexpected validation errors gracefully', () => {
      const invalidInput = null

      const result = validateInfrastructureConfig(invalidInput)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeDefined()
      }
    })
  })
})
