import { randomUUID } from 'crypto'
import { globalLogger } from './logger'
import { Event, QueueConfig, Handler } from './types'

type QueuedMessage<TData = unknown> = {
  id: string
  event: Event<TData>
  attempts: number
  visibleAt: number
  messageGroupId?: string
  queueConfig: QueueConfig
}

type QueueSubscription = {
  handler: Handler
  queueConfig: QueueConfig
}

function calculateRetryDelay(attempt: number, strategy: QueueConfig['retryStrategy']): number {
  const baseDelay = 1000

  switch (strategy) {
    case 'none':
      return 0
    case 'exponential':
      return baseDelay * Math.pow(2, attempt)
    case 'jitter':
      return baseDelay * Math.pow(2, attempt) + Math.random() * baseDelay
  }
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

class QueueManager {
  private queues: Record<string, QueuedMessage[]> = {}
  private subscriptions: Record<string, QueueSubscription[]> = {}
  private lockedGroups: Set<string> = new Set()
  private processingTimers: Record<string, NodeJS.Timeout> = {}

  private processQueue(topic: string): void {
    const queue = this.queues[topic]
    if (!queue || queue.length === 0) {
      return
    }

    const now = Date.now()
    const visibleMessages = queue.filter((msg) => msg.visibleAt <= now)

    for (const message of visibleMessages) {
      if (message.queueConfig.type === 'fifo' && message.messageGroupId) {
        const lockKey = `${topic}:${message.messageGroupId}`
        if (this.lockedGroups.has(lockKey)) {
          continue
        }

        this.lockedGroups.add(lockKey)
        this.processMessage(topic, message, lockKey)
      } else {
        this.processMessage(topic, message)
      }
    }
  }

  private processMessage(topic: string, message: QueuedMessage, lockKey?: string): void {
    const handlers = this.subscriptions[topic] || []
    const handler = handlers.find((s) => s.queueConfig === message.queueConfig)

    if (!handler) {
      this.removeMessageFromQueue(topic, message.id)
      if (lockKey) {
        this.lockedGroups.delete(lockKey)
      }
      return
    }

    const visibilityTimeoutMs = message.queueConfig.visibilityTimeout * 1000
    message.visibleAt = Date.now() + visibilityTimeoutMs

    handler.handler(message.event)
      .then(() => {
        this.removeMessageFromQueue(topic, message.id)

        if (lockKey) {
          this.lockedGroups.delete(lockKey)
        }
      })
      .catch((error) => {
        message.attempts++

        if (message.attempts >= message.queueConfig.maxRetries) {
          globalLogger.error('[Queue DLQ] Message moved to dead-letter queue after max retries', {
            topic,
            messageId: message.id,
            attempts: message.attempts,
            error: error instanceof Error ? error.message : 'Unknown error',
          })

          this.removeMessageFromQueue(topic, message.id)

          if (lockKey) {
            this.lockedGroups.delete(lockKey)
          }
        } else {
          const retryDelay = calculateRetryDelay(message.attempts, message.queueConfig.retryStrategy)
          const newVisibilityTimeout = Math.max(retryDelay, visibilityTimeoutMs)

          message.visibleAt = Date.now() + newVisibilityTimeout

          if (lockKey) {
            this.lockedGroups.delete(lockKey)
          }
        }
      })
  }

  private removeMessageFromQueue(topic: string, messageId: string): void {
    const queue = this.queues[topic]
    if (!queue) {
      return
    }

    const index = queue.findIndex((msg) => msg.id === messageId)
    if (index !== -1) {
      queue.splice(index, 1)
    }

    if (queue.length === 0) {
      delete this.queues[topic]
      if (this.processingTimers[topic]) {
        clearInterval(this.processingTimers[topic])
        delete this.processingTimers[topic]
      }
    }
  }

  private startQueueProcessor(topic: string): void {
    if (this.processingTimers[topic]) {
      return
    }

    this.processingTimers[topic] = setInterval(() => {
      this.processQueue(topic)
    }, 100)
  }

  async enqueue<TData>(topic: string, event: Event<TData>): Promise<void> {
    const handlers = this.subscriptions[topic] || []

    for (const subscription of handlers) {
      const messageGroupId = extractMessageGroupId(event, subscription.queueConfig.messageGroupId)

      const delayMs = subscription.queueConfig.delay * 1000
      const visibleAt = Date.now() + delayMs

      const queuedMessage: QueuedMessage<TData> = {
        id: randomUUID(),
        event,
        attempts: 0,
        visibleAt,
        messageGroupId,
        queueConfig: subscription.queueConfig,
      }


      if (!this.queues[topic]) {
        this.queues[topic] = []
      }

      this.queues[topic].push(queuedMessage as QueuedMessage)

      this.startQueueProcessor(topic)
    }

    setImmediate(() => this.processQueue(topic))
  }

  subscribe(topic: string, handler: Handler, queueConfig: QueueConfig): void {
    if (!this.subscriptions[topic]) {
      this.subscriptions[topic] = []
    }

    this.subscriptions[topic].push({ handler, queueConfig })
  }

  unsubscribe(topic: string, handler: Handler): void {
    if (!this.subscriptions[topic]) {
      return
    }

    this.subscriptions[topic] = this.subscriptions[topic].filter((sub) => sub.handler !== handler)

    if (this.subscriptions[topic].length === 0) {
      delete this.subscriptions[topic]

      if (this.processingTimers[topic]) {
        clearInterval(this.processingTimers[topic])
        delete this.processingTimers[topic]
      }
    }
  }
}

export const queueManager = new QueueManager()
