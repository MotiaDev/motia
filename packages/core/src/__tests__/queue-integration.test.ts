import { Logger } from '../logger'
import { NoTracer } from '../observability/no-tracer'
import { QueueManager } from '../queue-manager'
import { type Event, Handler, type QueueConfig } from '../types'

jest.useFakeTimers({ doNotFake: ['nextTick'] })

describe('Queue Integration Tests', () => {
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

  const createEvent = (topic: string, data: unknown = {}, messageGroupId?: string): Event => ({
    topic,
    data,
    traceId: 'test-trace-id',
    flows: ['test-flow'],
    logger: new Logger(),
    tracer: new NoTracer(),
    messageGroupId,
  })

  const createQueueConfig = (overrides?: Partial<QueueConfig>): QueueConfig => ({
    type: 'standard',
    maxRetries: 3,
    visibilityTimeout: 30,
    delaySeconds: 0,
    ...overrides,
  })

  describe('End-to-End Flow', () => {
    it('should process message from emit to completion', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()
      const event = createEvent('test.topic', { value: 'test' })

      queueManager.subscribe('test.topic', handler, queueConfig, 'sub-1')
      await queueManager.enqueue('test.topic', event)

      jest.advanceTimersByTime(0)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledWith(event)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should track metrics throughout the flow', async () => {
      const handler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()
      const event = createEvent('test.topic')

      queueManager.subscribe('test.topic', handler, queueConfig, 'sub-1')

      const initialMetrics = queueManager.getMetrics('test.topic')
      expect(initialMetrics).toBeUndefined()

      await queueManager.enqueue('test.topic', event)

      let metrics = queueManager.getMetrics('test.topic')
      expect(metrics?.queueDepth).toBe(1)

      jest.advanceTimersByTime(0)
      await Promise.resolve()

      metrics = queueManager.getMetrics('test.topic')
      expect(metrics?.queueDepth).toBe(0)
      expect(metrics?.processingCount).toBe(0)
    })
  })

  describe('Retry Flow', () => {
    it('should retry on failure and track retry count', async () => {
      let callCount = 0
      const handler = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Simulated error'))
        }
        return Promise.resolve(undefined)
      })

      const queueConfig = createQueueConfig({ maxRetries: 5, visibilityTimeout: 10 })
      const event = createEvent('retry.topic')

      queueManager.subscribe('retry.topic', handler, queueConfig, 'sub-1')
      await queueManager.enqueue('retry.topic', event)

      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(0)
        await Promise.resolve()

        if (callCount >= 3) break

        jest.advanceTimersByTime(10000)
      }

      expect(handler).toHaveBeenCalledTimes(3)
      const metrics = queueManager.getMetrics('retry.topic')
      expect(metrics?.retriesCount).toBe(2)
      expect(metrics?.queueDepth).toBe(0)
    })

    it('should move to DLQ after max retries', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Permanent failure'))
      const queueConfig = createQueueConfig({ maxRetries: 2, visibilityTimeout: 10 })
      const event = createEvent('dlq.topic')

      queueManager.subscribe('dlq.topic', handler, queueConfig, 'sub-1')
      await queueManager.enqueue('dlq.topic', event)

      jest.advanceTimersByTime(0)
      await Promise.resolve()
      await Promise.resolve()

      jest.advanceTimersByTime(10000)
      jest.advanceTimersByTime(0)
      await Promise.resolve()
      await Promise.resolve()

      jest.advanceTimersByTime(10000)
      jest.advanceTimersByTime(0)
      await Promise.resolve()
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
      const metrics = queueManager.getMetrics('dlq.topic')
      expect(metrics?.dlqCount).toBe(1)
      expect(metrics?.queueDepth).toBe(0)
    })
  })

  describe('FIFO Ordering', () => {
    it('should process messages with same messageGroupId sequentially', async () => {
      const processedOrder: number[] = []
      const handler = jest.fn().mockImplementation((event: Event<{ order: number }>) => {
        processedOrder.push(event.data.order)
        return Promise.resolve(undefined)
      })

      const queueConfig = createQueueConfig({ type: 'fifo' })

      queueManager.subscribe('fifo.topic', handler, queueConfig, 'sub-1')

      await queueManager.enqueue('fifo.topic', createEvent('fifo.topic', { order: 1, groupId: 'A' }))
      await queueManager.enqueue('fifo.topic', createEvent('fifo.topic', { order: 2, groupId: 'A' }))
      await queueManager.enqueue('fifo.topic', createEvent('fifo.topic', { order: 3, groupId: 'A' }))

      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(0)
        await Promise.resolve()
      }

      expect(processedOrder).toEqual([1, 2, 3])
    })

    it('should process messages with different messageGroupIds in parallel', async () => {
      const processedGroups: string[] = []
      const handler = jest.fn().mockImplementation((event: Event<{ groupId: string }>) => {
        processedGroups.push(event.data.groupId)
        return Promise.resolve(undefined)
      })

      const queueConfig = createQueueConfig({ type: 'fifo' })

      queueManager.subscribe('fifo.topic', handler, queueConfig, 'sub-1')

      await queueManager.enqueue('fifo.topic', createEvent('fifo.topic', { groupId: 'A' }, 'group-A'))
      await queueManager.enqueue('fifo.topic', createEvent('fifo.topic', { groupId: 'B' }, 'group-B'))

      jest.advanceTimersByTime(0)
      await Promise.resolve()

      expect(handler).toHaveBeenCalledTimes(2)
      expect(processedGroups).toContain('A')
      expect(processedGroups).toContain('B')
    })
  })

  describe('Hot-Reload Scenario', () => {
    it('should continue processing with new handler after replacement', async () => {
      const oldHandler = jest.fn().mockResolvedValue(undefined)
      const newHandler = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig({ visibilityTimeout: 5 })

      queueManager.subscribe('reload.topic', oldHandler, queueConfig, 'sub-1')

      await queueManager.enqueue('reload.topic', createEvent('reload.topic', { value: 'message1' }))

      jest.advanceTimersByTime(0)
      await Promise.resolve()

      expect(oldHandler).toHaveBeenCalledTimes(1)

      queueManager.unsubscribe('reload.topic', oldHandler)
      queueManager.subscribe('reload.topic', newHandler, queueConfig, 'sub-1')

      await queueManager.enqueue('reload.topic', createEvent('reload.topic', { value: 'message2' }))

      jest.advanceTimersByTime(0)
      await Promise.resolve()

      expect(newHandler).toHaveBeenCalledTimes(1)
      expect(oldHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visibility Timeout Behavior', () => {
    it('should make message invisible during processing', async () => {
      let processingStarted = false
      const slowHandler = jest.fn().mockImplementation(() => {
        processingStarted = true
        return new Promise((resolve) => setTimeout(resolve, 5000))
      })

      const queueConfig = createQueueConfig({ visibilityTimeout: 10 })
      const event = createEvent('visibility.topic')

      queueManager.subscribe('visibility.topic', slowHandler, queueConfig, 'sub-1')
      await queueManager.enqueue('visibility.topic', event)

      jest.advanceTimersByTime(0)
      await Promise.resolve()

      expect(processingStarted).toBe(true)
      expect(slowHandler).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(5000)
      await Promise.resolve()

      expect(slowHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Observability', () => {
    it('should provide metrics for all topics', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined)
      const handler2 = jest.fn().mockResolvedValue(undefined)
      const queueConfig = createQueueConfig()

      queueManager.subscribe('topic1', handler1, queueConfig, 'sub-1')
      queueManager.subscribe('topic2', handler2, queueConfig, 'sub-2')

      await queueManager.enqueue('topic1', createEvent('topic1'))
      await queueManager.enqueue('topic2', createEvent('topic2'))

      const allMetrics = queueManager.getAllMetrics()
      expect(allMetrics).toHaveProperty('topic1')
      expect(allMetrics).toHaveProperty('topic2')
      expect(allMetrics.topic1.queueDepth).toBe(1)
      expect(allMetrics.topic2.queueDepth).toBe(1)
    })
  })
})
