import type { Event, EventAdapter, QueueConfig, SubscriptionHandle } from '@motiadev/core'
import { buildConfig } from './config-builder'
import { ConnectionManager } from './connection-manager'
import { DLQManager } from './dlq-manager'
import { QueueManager } from './queue-manager'
import type { BullMQEventAdapterConfig } from './types'
import { WorkerManager } from './worker-manager'

export class BullMQEventAdapter implements EventAdapter {
  private readonly connectionManager: ConnectionManager
  private readonly queueManager: QueueManager
  private readonly workerManager: WorkerManager
  private readonly dlqManager: DLQManager

  constructor(config: BullMQEventAdapterConfig) {
    const mergedConfig = buildConfig(config)
    this.connectionManager = new ConnectionManager(config.connection)
    this.queueManager = new QueueManager(this.connectionManager.connection, mergedConfig)
    this.dlqManager = new DLQManager(this.connectionManager.connection, mergedConfig)
    this.workerManager = new WorkerManager(
      this.connectionManager.connection,
      mergedConfig,
      (topic, stepName) => this.queueManager.getQueueName(topic, stepName),
      this.dlqManager,
    )
  }

  async emit<TData>(event: Event<TData>): Promise<void> {
    const subscribers = this.workerManager.getSubscribers(event.topic)
    if (subscribers.length === 0) {
      return
    }

    await this.queueManager.enqueueToAll(event, subscribers)
  }

  async subscribe<TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: QueueConfig,
  ): Promise<SubscriptionHandle> {
    const queueName = this.queueManager.getQueueName(topic, stepName)
    this.queueManager.getQueue(queueName)

    return this.workerManager.createWorker(topic, stepName, handler, options)
  }

  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    const workerInfo = this.workerManager.getWorkerInfo(handle.id)
    if (workerInfo) {
      const queueName = this.queueManager.getQueueName(workerInfo.topic, workerInfo.stepName)
      await this.queueManager.closeQueue(queueName)
      await this.workerManager.removeWorker(handle.id)
    }
  }

  async shutdown(): Promise<void> {
    await Promise.allSettled([this.workerManager.closeAll(), this.queueManager.closeAll(), this.dlqManager.closeAll()])

    try {
      await this.connectionManager.close()
    } catch (err) {
      console.error('[BullMQ] Error closing connection:', err)
    }
  }

  async getSubscriptionCount(topic: string): Promise<number> {
    return this.workerManager.getSubscriptionCount(topic)
  }

  async listTopics(): Promise<string[]> {
    return this.workerManager.listTopics()
  }
}
