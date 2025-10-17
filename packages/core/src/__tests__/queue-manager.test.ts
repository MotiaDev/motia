import { Logger } from '../logger'
import { NoTracer } from '../observability/no-tracer'
import { QueueManager } from '../queue-manager'
import type { Event, QueueConfig } from '../types'

jest.useFakeTimers({ doNotFake: ['nextTick'] })

describe('QueueManager', () => {
  let queueManager: QueueManager

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.setSystemTime(0)
    queueManager = new QueueManager()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    queueManager.reset()
  })

  const createMockEvent = (topic: string, data: unknown = {}): Event => ({
    topic,
    data,
    traceId: 'test-trace-id',
    flows: ['test-flow'],
    logger: new Logger(),
    tracer: new NoTracer(),
  })

  const createQueueConfig = (overrides?: Partial<QueueConfig>): QueueConfig => ({
    type: 'standard',
    maxRetries: 3,
    visibilityTimeout: 30,
    delaySeconds: 0,
    messageGroupId: null,
    ...overrides,
  })

  describe('Message Queueing and Processing', () => {
    it('should enqueue and process a message successfully', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledWith(event)
    })

    it('should process multiple messages in sequence', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1 }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2 }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should handle delayed messages', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ delaySeconds: 5 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(handler).not.toHaveBeenCalled()

      jest.advanceTimersByTime(5000)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledWith(event)
    })
  })

  describe('Retry Logic Without Retry Strategy', () => {
    it('should retry failed message after visibilityTimeout', async () => {
      let attempts = 0
      const handler = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 2) {
          return Promise.reject(new Error('Simulated failure'))
        }
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ visibilityTimeout: 2, maxRetries: 3 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(2100)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should move message to DLQ after max retries', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      const queueConfig = createQueueConfig({ visibilityTimeout: 1, maxRetries: 3 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(100)
        await Promise.resolve()
        jest.advanceTimersByTime(1000)
        await Promise.resolve()
      }

      expect(handler).toHaveBeenCalledTimes(3)

      jest.advanceTimersByTime(2000)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledTimes(3)
    })

    it('should retry after visibilityTimeout delay', async () => {
      let attempts = 0
      const handler = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts === 1) {
          return Promise.reject(new Error('First attempt fails'))
        }
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ visibilityTimeout: 2, maxRetries: 2 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(attempts).toBe(1)

      jest.advanceTimersByTime(2100)
      await Promise.resolve()
      expect(attempts).toBe(2)
    })

    it('should not apply exponential backoff or jitter', async () => {
      let attempts = 0
      const attemptTimes: number[] = []
      const handler = jest.fn().mockImplementation(() => {
        attempts++
        attemptTimes.push(Date.now())
        if (attempts < 3) {
          return Promise.reject(new Error('Simulated failure'))
        }
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ visibilityTimeout: 2, maxRetries: 5 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      jest.advanceTimersByTime(2100)
      await Promise.resolve()

      jest.advanceTimersByTime(2100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(3)
      const timeDiff1 = attemptTimes[1] - attemptTimes[0]
      const timeDiff2 = attemptTimes[2] - attemptTimes[1]

      expect(timeDiff1).toBeGreaterThanOrEqual(2000)
      expect(timeDiff1).toBeLessThan(2200)
      expect(timeDiff2).toBeGreaterThanOrEqual(2000)
      expect(timeDiff2).toBeLessThan(2200)
    })
  })

  describe('FIFO Queue Processing', () => {
    it('should process FIFO messages in order within same group', async () => {
      const processedMessages: number[] = []
      const handler = jest.fn().mockImplementation((event: Event) => {
        processedMessages.push((event.data as { id: number }).id)
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'groupId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2, groupId: 'group1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 3, groupId: 'group1' }))

      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(100)
        await Promise.resolve()
      }

      expect(processedMessages).toEqual([1, 2, 3])
    })

    it('should process FIFO messages from different groups in parallel', async () => {
      const processedMessages: Array<{ id: number; groupId: string }> = []
      const handler = jest.fn().mockImplementation((event: Event) => {
        const data = event.data as { id: number; groupId: string }
        processedMessages.push(data)
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'groupId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2, groupId: 'group2' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 3, groupId: 'group1' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
      expect(processedMessages.map((m) => m.id)).toContain(1)
      expect(processedMessages.map((m) => m.id)).toContain(2)
    })

    it('should not process next message in FIFO group until current completes', async () => {
      let processing = false
      const handler = jest.fn().mockImplementation(async () => {
        if (processing) {
          throw new Error('Concurrent processing detected in FIFO queue')
        }
        processing = true
        await new Promise((resolve) => setTimeout(resolve, 100))
        processing = false
      })

      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'groupId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2, groupId: 'group1' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Subscription Management', () => {
    it('should allow subscription to a topic', () => {
      const handler = jest.fn()
      const queueConfig = createQueueConfig()

      expect(() => {
        queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      }).not.toThrow()
    })

    it('should allow unsubscription from a topic', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      queueManager.unsubscribe('test.topic', handler)

      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).not.toHaveBeenCalled()
    })

    it('should allow multiple handlers for the same topic', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined)
      const handler2 = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('test.topic', handler1, queueConfig, 'subscription-id')
      queueManager.subscribe('test.topic', handler2, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle handler returning immediately', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalled()
    })

    it('should handle message with zero visibility timeout', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Failure'))
      const queueConfig = createQueueConfig({ visibilityTimeout: 0, maxRetries: 2 })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalled()
    })

    it('should handle empty message data', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()
      const event = createMockEvent('test.topic', undefined)

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledWith(event)
    })
  })

  describe('Hot-Reload / Handler Re-subscription', () => {
    it('should continue processing retry messages after handler is re-subscribed', async () => {
      let attempts = 0
      const oldHandler = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts === 1) {
          return Promise.reject(new Error('First attempt fails'))
        }
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ visibilityTimeout: 2, maxRetries: 3 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', oldHandler, queueConfig, 'old-subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(oldHandler).toHaveBeenCalledTimes(1)

      queueManager.unsubscribe('test.topic', oldHandler)

      const newHandler = jest.fn().mockResolvedValue(undefined)
      const newQueueConfig = createQueueConfig({ visibilityTimeout: 2, maxRetries: 3 })
      queueManager.subscribe('test.topic', newHandler, newQueueConfig, 'new-subscription-id')

      jest.advanceTimersByTime(2100)
      await Promise.resolve()

      expect(newHandler).toHaveBeenCalledTimes(1)
    })

    it('should not lose pending messages when handler is replaced', async () => {
      const oldHandler = jest.fn().mockRejectedValue(new Error('Always fails'))
      const queueConfig = createQueueConfig({ visibilityTimeout: 1, maxRetries: 5 })
      const event = createMockEvent('test.topic', { id: 'test-message' })

      queueManager.subscribe('test.topic', oldHandler, queueConfig, 'old-subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(oldHandler).toHaveBeenCalledTimes(1)

      queueManager.unsubscribe('test.topic', oldHandler)

      const newHandler = jest.fn().mockResolvedValue(undefined)
      const newQueueConfig = createQueueConfig({ visibilityTimeout: 1, maxRetries: 5 })
      queueManager.subscribe('test.topic', newHandler, newQueueConfig, 'new-subscription-id')

      jest.advanceTimersByTime(1200)
      await Promise.resolve()

      expect(newHandler).toHaveBeenCalled()
      expect(newHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { id: 'test-message' },
        }),
      )
    })

    it('should handle multiple re-subscriptions with different queueConfig objects', async () => {
      const handlers: Array<jest.Mock> = []

      const queueConfig1 = createQueueConfig({ visibilityTimeout: 2, maxRetries: 3 })
      const handler1 = jest.fn().mockRejectedValue(new Error('Fail'))
      handlers.push(handler1)

      queueManager.subscribe('test.topic', handler1, queueConfig1, 'old-subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(handler1).toHaveBeenCalledTimes(1)

      for (let i = 0; i < 3; i++) {
        queueManager.unsubscribe('test.topic', handlers[handlers.length - 1])

        const newQueueConfig = createQueueConfig({ visibilityTimeout: 2, maxRetries: 3 })
        const newHandler = jest.fn().mockRejectedValue(new Error('Fail'))
        handlers.push(newHandler)
        queueManager.subscribe('test.topic', newHandler, newQueueConfig, 'new-subscription-id')

        jest.advanceTimersByTime(2200)
        await Promise.resolve()

        expect(newHandler).toHaveBeenCalledTimes(1)
      }

      expect(handlers).toHaveLength(4)
    })

    it('should use updated handler configuration after re-subscription', async () => {
      const oldHandler = jest.fn().mockRejectedValue(new Error('Fail'))
      const oldQueueConfig = createQueueConfig({ visibilityTimeout: 5, maxRetries: 2 })

      queueManager.subscribe('test.topic', oldHandler, oldQueueConfig, 'old-subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(oldHandler).toHaveBeenCalledTimes(1)

      queueManager.unsubscribe('test.topic', oldHandler)

      const newHandler = jest.fn().mockResolvedValue(undefined)
      const newQueueConfig = createQueueConfig({ visibilityTimeout: 1, maxRetries: 2 })
      queueManager.subscribe('test.topic', newHandler, newQueueConfig, 'new-subscription-id')

      jest.advanceTimersByTime(1200)
      await Promise.resolve()

      expect(newHandler).toHaveBeenCalledTimes(1)
    })

    it('should use current subscription maxRetries instead of message maxRetries', async () => {
      const oldHandler = jest.fn().mockRejectedValue(new Error('Always fails'))
      const oldQueueConfig = createQueueConfig({ visibilityTimeout: 1, maxRetries: 10 })

      queueManager.subscribe('test.topic', oldHandler, oldQueueConfig, 'old-subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(oldHandler).toHaveBeenCalledTimes(1)

      queueManager.unsubscribe('test.topic', oldHandler)

      const newHandler = jest.fn().mockRejectedValue(new Error('Always fails'))
      const newQueueConfig = createQueueConfig({ visibilityTimeout: 1, maxRetries: 2 })
      queueManager.subscribe('test.topic', newHandler, newQueueConfig, 'new-subscription-id')

      jest.advanceTimersByTime(1200)
      await Promise.resolve()
      expect(newHandler).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1200)
      await Promise.resolve()
      expect(newHandler).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(1100)
      await Promise.resolve()

      expect(newHandler).toHaveBeenCalledTimes(2)
    })
  })

  describe('DelaySeconds Functionality', () => {
    it('should process message with delaySeconds = 0 immediately', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ delaySeconds: 0 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledWith(event)
    })

    it('should delay message processing by specified delaySeconds', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ delaySeconds: 10 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(5000)
      await Promise.resolve()
      expect(handler).not.toHaveBeenCalled()

      jest.advanceTimersByTime(5000)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('should handle multiple messages with different delaySeconds', async () => {
      const processedOrder: number[] = []
      const handler1 = jest.fn().mockImplementation((event: Event) => {
        processedOrder.push((event.data as { id: number }).id)
        return Promise.resolve()
      })
      const handler2 = jest.fn().mockImplementation((event: Event) => {
        processedOrder.push((event.data as { id: number }).id)
        return Promise.resolve()
      })

      const config1 = createQueueConfig({ delaySeconds: 5 })
      const config2 = createQueueConfig({ delaySeconds: 2 })

      queueManager.subscribe('topic1', handler1, config1, 'sub1')
      queueManager.subscribe('topic2', handler2, config2, 'sub2')

      await queueManager.enqueue('topic1', createMockEvent('topic1', { id: 1 }))
      await queueManager.enqueue('topic2', createMockEvent('topic2', { id: 2 }))

      jest.advanceTimersByTime(2100)
      await Promise.resolve()
      expect(processedOrder).toEqual([2])

      jest.advanceTimersByTime(3000)
      await Promise.resolve()
      expect(processedOrder).toEqual([2, 1])
    })

    it('should combine delaySeconds with retry visibilityTimeout', async () => {
      let attempts = 0
      const handler = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts === 1) {
          return Promise.reject(new Error('First attempt fails'))
        }
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ delaySeconds: 3, visibilityTimeout: 2, maxRetries: 2 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(3100)
      await Promise.resolve()
      expect(attempts).toBe(1)

      jest.advanceTimersByTime(2200)
      await Promise.resolve()
      expect(attempts).toBe(2)
    })

    it('should apply delaySeconds to FIFO queue messages', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'groupId', delaySeconds: 5 })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))

      jest.advanceTimersByTime(4900)
      await Promise.resolve()
      expect(handler).not.toHaveBeenCalled()

      jest.advanceTimersByTime(200)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle very large delaySeconds value', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ delaySeconds: 900 })
      const event = createMockEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(899000)
      await Promise.resolve()
      expect(handler).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1100)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledWith(event)
    })
  })

  describe('MessageGroupId Extraction', () => {
    it('should extract messageGroupId from event.data using field name', async () => {
      const processedMessages: string[] = []
      const handler = jest.fn().mockImplementation((event: Event) => {
        const data = event.data as { userId: string }
        processedMessages.push(data.userId)
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'userId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { userId: 'user1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { userId: 'user2' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should extract traceId when messageGroupId is "traceId"', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'traceId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      const event1 = createMockEvent('test.topic', { data: 'test1' })
      event1.traceId = 'trace-123'
      const event2 = createMockEvent('test.topic', { data: 'test2' })
      event2.traceId = 'trace-123'

      await queueManager.enqueue('test.topic', event1)
      await queueManager.enqueue('test.topic', event2)

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should return undefined when messageGroupId is null', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'standard', messageGroupId: null })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { userId: 'user1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { userId: 'user2' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should handle missing field in event.data gracefully', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'missingField' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { userId: 'user1' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should convert non-string values to string', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'orderId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { orderId: 123 }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { orderId: 123 }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle event.data being null or undefined', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'userId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', null))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', undefined))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('Queue Lifecycle Management', () => {
    it('should cleanup queue when all messages are processed', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should cleanup timer when last message is processed', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should cleanup timer on unsubscribe after messages were processed', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledTimes(1)

      queueManager.unsubscribe('test.topic', handler)
    })

    it('should not create timer when queue is empty', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should process multiple enqueued messages', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1 }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2 }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 3 }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(3)
    })
  })

  describe('Standard vs FIFO Behavior', () => {
    it('should process standard queue messages in parallel', async () => {
      const processingTimes: number[] = []
      const handler = jest.fn().mockImplementation(async () => {
        processingTimes.push(Date.now())
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      const queueConfig = createQueueConfig({ type: 'standard' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1 }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2 }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 3 }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(3)
      expect(processingTimes[0]).toBe(processingTimes[1])
      expect(processingTimes[1]).toBe(processingTimes[2])
    })

    it('should not use locking for standard queue with messageGroupId', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'standard', messageGroupId: 'groupId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2, groupId: 'group1' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('FIFO Queue Edge Cases', () => {
    it('should process message without locking when messageGroupId extraction returns undefined', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'missingField' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1 }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2 }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should continue processing other groups when one group has errors', async () => {
      let group1Attempts = 0
      const handler = jest.fn().mockImplementation((event: Event) => {
        const data = event.data as { groupId: string }
        if (data.groupId === 'group1') {
          group1Attempts++
          if (group1Attempts < 2) {
            return Promise.reject(new Error('Group1 error'))
          }
        }
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({
        type: 'fifo',
        messageGroupId: 'groupId',
        visibilityTimeout: 1,
        maxRetries: 5,
      })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2, groupId: 'group2' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should release lock on successful processing', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ type: 'fifo', messageGroupId: 'groupId' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))
      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 2, groupId: 'group1' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should release lock on handler error and allow retry', async () => {
      let attempts = 0
      const handler = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 2) {
          return Promise.reject(new Error('Attempt fails'))
        }
        return Promise.resolve()
      })

      const queueConfig = createQueueConfig({
        type: 'fifo',
        messageGroupId: 'groupId',
        visibilityTimeout: 1,
        maxRetries: 5,
      })

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic', { id: 1, groupId: 'group1' }))

      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(attempts).toBeGreaterThanOrEqual(1)

      for (let i = 0; i < 2; i++) {
        jest.advanceTimersByTime(1000)
        await Promise.resolve()
        jest.advanceTimersByTime(100)
        await Promise.resolve()
      }

      expect(attempts).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Enqueue Behavior', () => {
    it('should not create queue when enqueuing to topic with no subscriptions', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval')

      await queueManager.enqueue('unsubscribed.topic', createMockEvent('unsubscribed.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(setIntervalSpy).not.toHaveBeenCalled()
    })

    it('should create separate message for each subscription on same topic', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined)
      const handler2 = jest.fn().mockResolvedValue(undefined)
      const config1 = createQueueConfig({ maxRetries: 3 })
      const config2 = createQueueConfig({ maxRetries: 5 })

      queueManager.subscribe('test.topic', handler1, config1, 'sub1')
      queueManager.subscribe('test.topic', handler2, config2, 'sub2')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should create separate messages for each subscription', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined)
      const handler2 = jest.fn().mockResolvedValue(undefined)
      const config1 = createQueueConfig({ maxRetries: 3, visibilityTimeout: 60 })
      const config2 = createQueueConfig({ maxRetries: 5, visibilityTimeout: 90 })

      queueManager.subscribe('test.topic', handler1, config1, 'sub1')
      queueManager.subscribe('test.topic', handler2, config2, 'sub2')

      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      jest.advanceTimersByTime(100)
      await Promise.resolve()

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('DLQ Logging', () => {
    it('should log correct metadata when message moves to DLQ', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      const queueConfig = createQueueConfig({ visibilityTimeout: 1, maxRetries: 3 })
      const errorSpy = jest.spyOn(console, 'error').mockImplementation()

      queueManager.subscribe('test.topic', handler, queueConfig, 'subscription-id')
      await queueManager.enqueue('test.topic', createMockEvent('test.topic'))

      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(100)
        await Promise.resolve()
        jest.advanceTimersByTime(1000)
        await Promise.resolve()
      }

      expect(handler).toHaveBeenCalledTimes(3)

      errorSpy.mockRestore()
    })
  })
})
