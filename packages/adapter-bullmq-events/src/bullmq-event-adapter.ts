import type { Event, EventAdapter, QueueConfig, SubscriptionHandle } from '@motiadev/core'
import type { Redis } from 'ioredis'
import { buildConfig, type MergedConfig } from './config-builder'
import { ConnectionManager } from './connection-manager'
import { DLQManager } from './dlq-manager'
import { QueueManager } from './queue-manager'
import type { BullMQEventAdapterConfig } from './types'
import { WorkerManager } from './worker-manager'

export class BullMQEventAdapter implements EventAdapter {
  private readonly connectionManager: ConnectionManager
  private readonly _queueManager: QueueManager
  private readonly _workerManager: WorkerManager
  private readonly _dlqManager: DLQManager
  private readonly _config: MergedConfig

  constructor(config: BullMQEventAdapterConfig) {
    this._config = buildConfig(config)
    this.connectionManager = new ConnectionManager(config.connection)
    this._queueManager = new QueueManager(this.connectionManager.connection, this._config)
    this._dlqManager = new DLQManager(this.connectionManager.connection, this._config)
    this._workerManager = new WorkerManager(
      this.connectionManager.connection,
      this._config,
      (topic, stepName) => this._queueManager.getQueueName(topic, stepName),
      this._dlqManager,
    )
  }

  get connection(): Redis {
    return this.connectionManager.connection
  }

  get prefix(): string {
    return this._config.prefix
  }

  get dlqSuffix(): string {
    return this._config.dlq.suffix
  }

  get queueManager(): QueueManager {
    return this._queueManager
  }

  get workerManager(): WorkerManager {
    return this._workerManager
  }

  get dlqManager(): DLQManager {
    return this._dlqManager
  }

  async emit<TData>(event: Event<TData>): Promise<void> {
    const subscribers = this._workerManager.getSubscribers(event.topic)
    if (subscribers.length === 0) {
      return
    }

    await this._queueManager.enqueueToAll(event, subscribers)
  }

  async subscribe<TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: QueueConfig,
  ): Promise<SubscriptionHandle> {
    const queueName = this._queueManager.getQueueName(topic, stepName)
    this._queueManager.getQueue(queueName)

    return this._workerManager.createWorker(topic, stepName, handler, options)
  }

  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    const workerInfo = this._workerManager.getWorkerInfo(handle.id)
    if (workerInfo) {
      const queueName = this._queueManager.getQueueName(workerInfo.topic, workerInfo.stepName)
      await this._queueManager.closeQueue(queueName)
      await this._workerManager.removeWorker(handle.id)
    }
  }

  async shutdown(): Promise<void> {
    await Promise.allSettled([
      this._workerManager.closeAll(),
      this._queueManager.closeAll(),
      this._dlqManager.closeAll(),
    ])

    try {
      await this.connectionManager.close()
    } catch (err) {
      console.error('[BullMQ] Error closing connection:', err)
    }
  }

  async getSubscriptionCount(topic: string): Promise<number> {
    return this._workerManager.getSubscriptionCount(topic)
  }

  async listTopics(): Promise<string[]> {
    return this._workerManager.listTopics()
  }
}
