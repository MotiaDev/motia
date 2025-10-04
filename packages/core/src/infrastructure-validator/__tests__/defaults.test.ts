import { getQueueConfigWithDefaults, DEFAULT_QUEUE_CONFIG } from '../defaults'
import { InfrastructureConfig } from '../../types'

describe('Infrastructure Defaults', () => {
  describe('DEFAULT_QUEUE_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_QUEUE_CONFIG.type).toBe('standard')
      expect(DEFAULT_QUEUE_CONFIG.maxRetries).toBe(3)
      expect(DEFAULT_QUEUE_CONFIG.visibilityTimeout).toBe(900)
      expect(DEFAULT_QUEUE_CONFIG.messageGroupId).toBe(null)
      expect(DEFAULT_QUEUE_CONFIG.delaySeconds).toBe(0)
    })
  })

  describe('getQueueConfigWithDefaults', () => {
    it('should return default config when no infrastructure provided', () => {
      const result = getQueueConfigWithDefaults()

      expect(result).toEqual(DEFAULT_QUEUE_CONFIG)
    })

    it('should return default config when infrastructure is undefined', () => {
      const result = getQueueConfigWithDefaults(undefined)

      expect(result).toEqual(DEFAULT_QUEUE_CONFIG)
    })

    it('should return default config when infrastructure is empty object', () => {
      const infrastructure: InfrastructureConfig = {}
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result).toEqual(DEFAULT_QUEUE_CONFIG)
    })

    it('should return default config when infrastructure.queue is undefined', () => {
      const infrastructure: InfrastructureConfig = {
        handler: {
          ram: 2048,
          timeout: 30,
        },
      }
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result).toEqual(DEFAULT_QUEUE_CONFIG)
    })

    it('should merge partial queue config with defaults', () => {
      const infrastructure: InfrastructureConfig = {
        queue: {
          maxRetries: 5,
        },
      }
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result).toEqual({
        ...DEFAULT_QUEUE_CONFIG,
        maxRetries: 5,
      })
    })

    it('should preserve all custom queue config values', () => {
      const customQueue = {
        type: 'fifo' as const,
        maxRetries: 10,
        visibilityTimeout: 60,
        messageGroupId: 'traceId',
        delaySeconds: 5,
      }
      const infrastructure: InfrastructureConfig = {
        queue: customQueue,
      }
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result).toEqual(customQueue)
    })

    it('should override only specified queue properties', () => {
      const infrastructure: InfrastructureConfig = {
        queue: {
          type: 'fifo',
          messageGroupId: 'userId',
        },
      }
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result.type).toBe('fifo')
      expect(result.messageGroupId).toBe('userId')
      expect(result.maxRetries).toBe(DEFAULT_QUEUE_CONFIG.maxRetries)
      expect(result.visibilityTimeout).toBe(DEFAULT_QUEUE_CONFIG.visibilityTimeout)
      expect(result.delaySeconds).toBe(DEFAULT_QUEUE_CONFIG.delaySeconds)
    })

    it('should handle queue with only type specified', () => {
      const infrastructure: InfrastructureConfig = {
        queue: {
          type: 'standard',
        },
      }
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result.type).toBe('standard')
      expect(result.maxRetries).toBe(DEFAULT_QUEUE_CONFIG.maxRetries)
      expect(result.visibilityTimeout).toBe(DEFAULT_QUEUE_CONFIG.visibilityTimeout)
    })

    it('should handle zero values correctly', () => {
      const infrastructure: InfrastructureConfig = {
        queue: {
          maxRetries: 0,
          delaySeconds: 0,
        },
      }
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result.maxRetries).toBe(0)
      expect(result.delaySeconds).toBe(0)
    })

    it('should handle null messageGroupId', () => {
      const infrastructure: InfrastructureConfig = {
        queue: {
          messageGroupId: null,
        },
      }
      const result = getQueueConfigWithDefaults(infrastructure)

      expect(result.messageGroupId).toBe(null)
    })

    it('should not mutate the input infrastructure object', () => {
      const infrastructure: InfrastructureConfig = {
        queue: {
          maxRetries: 5,
        },
      }
      const originalQueueRef = infrastructure.queue

      getQueueConfigWithDefaults(infrastructure)

      expect(infrastructure.queue).toBe(originalQueueRef)
      expect(infrastructure.queue).toEqual({ maxRetries: 5 })
    })
  })
})
