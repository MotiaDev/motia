import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_QUEUE_CONFIG } from '../infrastructure-validator/defaults'
import { QueueManager, type QueueMetrics } from '../queue-manager'
import type { Event, QueueConfig } from '../types'
import type { EventAdapter, SubscriptionHandle } from './event-adapter'

export class DefaultQueueEventAdapter implements EventAdapter {
  private queueManager: QueueManager = new QueueManager()
  private subscriptions: Map<string, { topic: string; handler: (event: Event<any>) => void | Promise<void> }> =
    new Map()

  async emit<TData>(event: Event<TData>): Promise<void> {
    await this.queueManager.enqueue(event.topic, event, event.messageGroupId)
  }

  async subscribe<TData>(
    topic: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    queueConfig?: QueueConfig,
  ): Promise<SubscriptionHandle> {
    const id = uuidv4()

    this.subscriptions.set(id, { topic, handler: handler as (event: Event<any>) => void | Promise<void> })

    const config = queueConfig || DEFAULT_QUEUE_CONFIG
    this.queueManager.subscribe(topic, handler as any, config, id)

    const handle: SubscriptionHandle = {
      topic,
      id,
      unsubscribe: async () => {
        await this.unsubscribe(handle)
      },
    }

    return handle
  }

  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    const subscription = this.subscriptions.get(handle.id)
    if (subscription) {
      this.queueManager.unsubscribe(handle.topic, subscription.handler as any)
      this.subscriptions.delete(handle.id)
    }
  }

  async shutdown(): Promise<void> {
    this.subscriptions.clear()
  }

  async getSubscriptionCount(topic: string): Promise<number> {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.topic === topic).length
  }

  async listTopics(): Promise<string[]> {
    return Array.from(new Set(Array.from(this.subscriptions.values()).map((sub) => sub.topic)))
  }

  getAllMetrics(): Record<string, QueueMetrics> {
    return this.queueManager.getAllMetrics()
  }
}
