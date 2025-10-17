import { randomUUID } from 'crypto'
import { EventEmitter } from 'events'
import { globalLogger, type Logger } from './logger'
import type { Event, Handler, QueueConfig } from './types'

export class QueueError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QueueError'
  }
}

export class HandlerTimeoutError extends QueueError {
  constructor(message: string) {
    super(message)
    this.name = 'HandlerTimeoutError'
  }
}

export class MaxRetriesError extends QueueError {
  constructor(
    message: string,
    public readonly attempts: number,
  ) {
    super(message)
    this.name = 'MaxRetriesError'
  }
}

type QueuedMessage<TData = unknown> = {
  id: string
  event: Event<TData>
  attempts: number
  visibleAt: number
  messageGroupId?: string
  queueConfig: QueueConfig
  subscriptionId: string
  internalSubscriptionId: string
}

type QueueSubscription = {
  handler: Handler
  queueConfig: QueueConfig
  subscriptionId: string
  internalSubscriptionId: string
}

type QueueMetrics = {
  queueDepth: number
  processingCount: number
  retriesCount: number
  dlqCount: number
}

function extractMessageGroupId(event: Event, messageGroupId: string | null | undefined): string | undefined {
  if (!messageGroupId) {
    return undefined
  }

  if (messageGroupId === 'traceId') {
    return event.traceId
  }

  try {
    const data = event.data as Record<string, unknown>
    const value = data[messageGroupId]
    return value !== undefined && value !== null ? String(value) : undefined
  } catch {
    return undefined
  }
}

export class QueueManager {
  private logger: Logger
  private queues: Record<string, QueuedMessage[]> = {}
  private subscriptions: Record<string, QueueSubscription[]> = {}
  private lockedGroups: Set<string> = new Set()
  private queueEmitter = new EventEmitter()
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private metrics: Map<string, QueueMetrics> = new Map()
  private topicListeners: Map<string, (t: string) => void> = new Map()
  private processingMessages: Set<string> = new Set()

  constructor(logger?: Logger) {
    this.logger = logger || globalLogger
  }

  private initMetrics(topic: string): void {
    if (!this.metrics.has(topic)) {
      this.metrics.set(topic, {
        queueDepth: 0,
        processingCount: 0,
        retriesCount: 0,
        dlqCount: 0,
      })
    }
  }

  private updateMetric(topic: string, key: keyof QueueMetrics, delta: number): void {
    this.initMetrics(topic)
    const metrics = this.metrics.get(topic)!
    metrics[key] = Math.max(0, metrics[key] + delta)
  }

  private processQueue(topic: string): void {
    const queue = this.queues[topic]
    if (!queue || queue.length === 0) {
      return
    }

    const now = Date.now()
    const visibleMessages = queue.filter((msg) => msg.visibleAt <= now && !this.processingMessages.has(msg.id))

    for (const message of visibleMessages) {
      if (message.queueConfig.type === 'fifo' && message.messageGroupId) {
        const lockKey = `${topic}:${message.messageGroupId}`
        if (this.lockedGroups.has(lockKey)) {
          continue
        }

        this.processingMessages.add(message.id)
        this.lockedGroups.add(lockKey)
        void this.processMessage(topic, message, lockKey)
      } else {
        this.processingMessages.add(message.id)
        void this.processMessage(topic, message)
      }
    }
  }

  private async processMessage(topic: string, message: QueuedMessage, lockKey?: string): Promise<void> {
    const handlers = this.subscriptions[topic] || []
    const handler =
      handlers.find((s) => s.internalSubscriptionId === message.internalSubscriptionId) ||
      handlers.find((s) => s.subscriptionId === message.subscriptionId) ||
      handlers[0]

    if (!handler) {
      this.processingMessages.delete(message.id)
      this.removeMessageFromQueue(topic, message.id)
      if (lockKey) {
        this.lockedGroups.delete(lockKey)
      }
      return
    }

    const handlerChanged = message.internalSubscriptionId !== handler.internalSubscriptionId
    if (handlerChanged && message.attempts > 0) {
      message.attempts = 0
      message.internalSubscriptionId = handler.internalSubscriptionId
      message.subscriptionId = handler.subscriptionId
      message.visibleAt = Date.now()
    }

    const visibilityTimeoutMs = handler.queueConfig.visibilityTimeout * 1000
    this.updateMetric(topic, 'processingCount', 1)

    try {
      await handler.handler(message.event)
      this.updateMetric(topic, 'processingCount', -1)
      this.processingMessages.delete(message.id)
      this.removeMessageFromQueue(topic, message.id)

      if (lockKey) {
        this.lockedGroups.delete(lockKey)
      }
      this.scheduleProcessing(topic, 0)
    } catch (error) {
      this.updateMetric(topic, 'processingCount', -1)
      this.processingMessages.delete(message.id)
      message.attempts++

      if (message.attempts >= handler.queueConfig.maxRetries) {
        const maxRetriesError = new MaxRetriesError(
          `Message failed after ${message.attempts} attempts`,
          message.attempts,
        )
        this.logger.error('[Queue DLQ] Message moved to dead-letter queue after max retries', {
          topic,
          messageId: message.id,
          attempts: message.attempts,
          originalError: error instanceof Error ? error.message : 'Unknown error',
          error: maxRetriesError.message,
        })

        this.updateMetric(topic, 'dlqCount', 1)
        this.removeMessageFromQueue(topic, message.id)

        if (lockKey) {
          this.lockedGroups.delete(lockKey)
        }
        this.scheduleProcessing(topic, 0)
      } else {
        this.updateMetric(topic, 'retriesCount', 1)
        message.visibleAt = Date.now() + handler.queueConfig.visibilityTimeout * 1000
        if (lockKey) {
          this.lockedGroups.delete(lockKey)
        }
        this.scheduleProcessing(topic, handler.queueConfig.visibilityTimeout * 1000)
      }
    }
  }

  private removeMessageFromQueue(topic: string, messageId: string): void {
    const queue = this.queues[topic]
    if (!queue) {
      return
    }

    const index = queue.findIndex((msg) => msg.id === messageId)
    if (index !== -1) {
      queue.splice(index, 1)
      this.updateMetric(topic, 'queueDepth', -1)
    }

    if (queue.length === 0) {
      delete this.queues[topic]
    }
  }

  private scheduleProcessing(topic: string, delayMs: number): void {
    const timeoutKey = `${topic}:${randomUUID()}`
    const timeout = setTimeout(() => {
      this.queueEmitter.emit('process', topic)
      this.scheduledTimeouts.delete(timeoutKey)
    }, delayMs)

    this.scheduledTimeouts.set(timeoutKey, timeout)
  }

  async enqueue<TData>(topic: string, event: Event<TData>, explicitMessageGroupId?: string): Promise<void> {
    const handlers = this.subscriptions[topic] || []

    if (handlers.length === 0) {
      return
    }

    for (const subscription of handlers) {
      const messageGroupId =
        explicitMessageGroupId !== undefined
          ? explicitMessageGroupId
          : extractMessageGroupId(event, subscription.queueConfig.messageGroupId)

      const delayMs = subscription.queueConfig.delaySeconds * 1000
      const visibleAt = Date.now() + delayMs

      const queuedMessage: QueuedMessage<TData> = {
        id: randomUUID(),
        event,
        attempts: 0,
        visibleAt,
        messageGroupId,
        queueConfig: subscription.queueConfig,
        subscriptionId: subscription.subscriptionId,
        internalSubscriptionId: subscription.internalSubscriptionId,
      }

      if (!this.queues[topic]) {
        this.queues[topic] = []
      }

      this.queues[topic].push(queuedMessage as QueuedMessage)
      this.updateMetric(topic, 'queueDepth', 1)

      this.scheduleProcessing(topic, delayMs)
    }
  }

  subscribe(topic: string, handler: Handler, queueConfig: QueueConfig, subscriptionId: string): void {
    if (!this.subscriptions[topic]) {
      this.subscriptions[topic] = []
      const listener = (t: string) => {
        if (t === topic) {
          this.processQueue(topic)
        }
      }
      this.topicListeners.set(topic, listener)
      this.queueEmitter.on('process', listener)
    }

    const internalSubscriptionId = randomUUID()
    this.subscriptions[topic].push({ handler, queueConfig, subscriptionId, internalSubscriptionId })

    if (this.queues[topic] && this.queues[topic].length > 0) {
      const now = Date.now()
      for (const message of this.queues[topic]) {
        if (
          message.internalSubscriptionId !== internalSubscriptionId &&
          message.subscriptionId !== subscriptionId &&
          message.attempts > 0
        ) {
          message.visibleAt = now
        }
      }
      this.scheduleProcessing(topic, 0)
    }
  }

  unsubscribe(topic: string, handler: Handler): void {
    if (!this.subscriptions[topic]) {
      return
    }

    this.subscriptions[topic] = this.subscriptions[topic].filter((sub) => sub.handler !== handler)

    if (this.subscriptions[topic].length === 0) {
      delete this.subscriptions[topic]
      const listener = this.topicListeners.get(topic)
      if (listener) {
        this.queueEmitter.off('process', listener)
        this.topicListeners.delete(topic)
      }
    }
  }

  getMetrics(topic: string): QueueMetrics | undefined {
    return this.metrics.get(topic)
  }

  getAllMetrics(): Record<string, QueueMetrics> {
    const result: Record<string, QueueMetrics> = {}
    this.metrics.forEach((metrics, topic) => {
      result[topic] = { ...metrics }
    })
    return result
  }

  reset(): void {
    this.scheduledTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.scheduledTimeouts.clear()
    this.queueEmitter.removeAllListeners()
    this.queues = {}
    this.subscriptions = {}
    this.lockedGroups = new Set()
    this.processingMessages = new Set()
    this.metrics.clear()
    this.topicListeners.clear()
  }
}
