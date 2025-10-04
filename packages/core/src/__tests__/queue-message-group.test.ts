import { QueueManager } from '../queue-manager'
import { Event, QueueConfig } from '../types'
import { globalLogger } from '../logger'

describe('QueueManager - messageGroupId from emit', () => {
  let queueManager: QueueManager

  beforeEach(() => {
    queueManager = new QueueManager(globalLogger)
  })

  afterEach(() => {
    queueManager.reset()
  })

  describe('Explicit messageGroupId from emit', () => {
    it('should use explicit messageGroupId from emit call for FIFO queue', async () => {
      const fifoConfig: QueueConfig = {
        type: 'fifo',
        messageGroupId: 'orderId',
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      const processedMessages: Array<{ messageGroupId?: string; data: any }> = []

      const handler = async (event: Event<any>) => {
        const queuedMessage = (queueManager as any).queues['test.topic']?.find(
          (m: any) => m.event.traceId === event.traceId,
        )
        processedMessages.push({
          messageGroupId: queuedMessage?.messageGroupId,
          data: event.data,
        })
      }

      queueManager.subscribe('test.topic', handler, fifoConfig, 'test-subscription')

      const explicitMessageGroupId = 'explicit-group-123'
      await queueManager.enqueue(
        'test.topic',
        {
          topic: 'test.topic',
          data: { orderId: 'order-456', value: 'test' },
          traceId: 'trace-1',
          flows: [],
          logger: globalLogger,
          tracer: {} as any,
        },
        explicitMessageGroupId,
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(processedMessages).toHaveLength(1)
      expect(processedMessages[0].messageGroupId).toBe(explicitMessageGroupId)
    })

    it('should prioritize explicit messageGroupId over config extraction', async () => {
      const fifoConfig: QueueConfig = {
        type: 'fifo',
        messageGroupId: 'orderId',
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      let capturedMessageGroupId: string | undefined

      const handler = async (event: Event<any>) => {
        const queuedMessage = (queueManager as any).queues['test.topic']?.find(
          (m: any) => m.event.traceId === event.traceId,
        )
        capturedMessageGroupId = queuedMessage?.messageGroupId
      }

      queueManager.subscribe('test.topic', handler, fifoConfig, 'test-subscription')

      const explicitMessageGroupId = 'explicit-override'
      await queueManager.enqueue(
        'test.topic',
        {
          topic: 'test.topic',
          data: { orderId: 'order-789', value: 'test' },
          traceId: 'trace-2',
          flows: [],
          logger: globalLogger,
          tracer: {} as any,
        },
        explicitMessageGroupId,
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(capturedMessageGroupId).toBe(explicitMessageGroupId)
      expect(capturedMessageGroupId).not.toBe('order-789')
    })

    it('should fall back to config extraction when no explicit messageGroupId provided', async () => {
      const fifoConfig: QueueConfig = {
        type: 'fifo',
        messageGroupId: 'orderId',
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      let capturedMessageGroupId: string | undefined

      const handler = async (event: Event<any>) => {
        const queuedMessage = (queueManager as any).queues['test.topic']?.find(
          (m: any) => m.event.traceId === event.traceId,
        )
        capturedMessageGroupId = queuedMessage?.messageGroupId
      }

      queueManager.subscribe('test.topic', handler, fifoConfig, 'test-subscription')

      await queueManager.enqueue('test.topic', {
        topic: 'test.topic',
        data: { orderId: 'order-999', value: 'test' },
        traceId: 'trace-3',
        flows: [],
        logger: globalLogger,
        tracer: {} as any,
      })

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(capturedMessageGroupId).toBe('order-999')
    })

    it('should handle explicit messageGroupId with standard queue', async () => {
      const standardConfig: QueueConfig = {
        type: 'standard',
        messageGroupId: null,
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      let capturedMessageGroupId: string | undefined

      const handler = async (event: Event<any>) => {
        const queuedMessage = (queueManager as any).queues['test.topic']?.find(
          (m: any) => m.event.traceId === event.traceId,
        )
        capturedMessageGroupId = queuedMessage?.messageGroupId
      }

      queueManager.subscribe('test.topic', handler, standardConfig, 'test-subscription')

      const explicitMessageGroupId = 'group-standard'
      await queueManager.enqueue(
        'test.topic',
        {
          topic: 'test.topic',
          data: { value: 'test' },
          traceId: 'trace-4',
          flows: [],
          logger: globalLogger,
          tracer: {} as any,
        },
        explicitMessageGroupId,
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(capturedMessageGroupId).toBe(explicitMessageGroupId)
    })
  })

  describe('FIFO ordering with explicit messageGroupId', () => {
    it('should process messages with same explicit messageGroupId in order', async () => {
      const fifoConfig: QueueConfig = {
        type: 'fifo',
        messageGroupId: null,
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      const processedOrder: number[] = []

      const handler = async (event: Event) => {
        processedOrder.push((event.data as { sequence: number }).sequence)
      }

      queueManager.subscribe('test.topic', handler, fifoConfig, 'test-subscription')

      const messageGroupId = 'group-ordered'
      for (let i = 1; i <= 3; i++) {
        await queueManager.enqueue(
          'test.topic',
          {
            topic: 'test.topic',
            data: { sequence: i },
            traceId: `trace-${i}`,
            flows: [],
            logger: globalLogger,
            tracer: {} as any,
          },
          messageGroupId,
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(processedOrder).toEqual([1, 2, 3])
    })

    it('should process messages with different explicit messageGroupId in parallel', async () => {
      const fifoConfig: QueueConfig = {
        type: 'fifo',
        messageGroupId: null,
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      const processedGroups: string[] = []

      const handler = async (event: Event) => {
        processedGroups.push((event.data as { group: string }).group)
      }

      queueManager.subscribe('test.topic', handler, fifoConfig, 'test-subscription')

      await queueManager.enqueue(
        'test.topic',
        {
          topic: 'test.topic',
          data: { group: 'A' },
          traceId: 'trace-a',
          flows: [],
          logger: globalLogger,
          tracer: {} as any,
        },
        'group-A',
      )

      await queueManager.enqueue(
        'test.topic',
        {
          topic: 'test.topic',
          data: { group: 'B' },
          traceId: 'trace-b',
          flows: [],
          logger: globalLogger,
          tracer: {} as any,
        },
        'group-B',
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(processedGroups).toHaveLength(2)
      expect(processedGroups).toContain('A')
      expect(processedGroups).toContain('B')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string as explicit messageGroupId', async () => {
      const fifoConfig: QueueConfig = {
        type: 'fifo',
        messageGroupId: 'orderId',
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      let capturedMessageGroupId: string | undefined

      const handler = async (event: Event<any>) => {
        const queuedMessage = (queueManager as any).queues['test.topic']?.find(
          (m: any) => m.event.traceId === event.traceId,
        )
        capturedMessageGroupId = queuedMessage?.messageGroupId
      }

      queueManager.subscribe('test.topic', handler, fifoConfig, 'test-subscription')

      await queueManager.enqueue(
        'test.topic',
        {
          topic: 'test.topic',
          data: { orderId: 'order-123', value: 'test' },
          traceId: 'trace-empty',
          flows: [],
          logger: globalLogger,
          tracer: {} as any,
        },
        '',
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(capturedMessageGroupId).toBe('')
    })

    it('should handle undefined explicit messageGroupId', async () => {
      const fifoConfig: QueueConfig = {
        type: 'fifo',
        messageGroupId: 'orderId',
        maxRetries: 3,
        visibilityTimeout: 30,
        delaySeconds: 0,
      }

      let capturedMessageGroupId: string | undefined

      const handler = async (event: Event<any>) => {
        const queuedMessage = (queueManager as any).queues['test.topic']?.find(
          (m: any) => m.event.traceId === event.traceId,
        )
        capturedMessageGroupId = queuedMessage?.messageGroupId
      }

      queueManager.subscribe('test.topic', handler, fifoConfig, 'test-subscription')

      await queueManager.enqueue(
        'test.topic',
        {
          topic: 'test.topic',
          data: { orderId: 'order-456', value: 'test' },
          traceId: 'trace-undef',
          flows: [],
          logger: globalLogger,
          tracer: {} as any,
        },
        undefined,
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(capturedMessageGroupId).toBe('order-456')
    })
  })
})
