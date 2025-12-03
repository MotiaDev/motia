import type { Event, QueueConfig, SubscriptionHandle } from '@motiadev/core'
import { type Job, Worker } from 'bullmq'
import type { Redis } from 'ioredis'
import { v4 as uuidv4 } from 'uuid'
import type { MergedConfig } from './config-builder'
import { FIFO_CONCURRENCY, MILLISECONDS_PER_SECOND } from './constants'
import type { DLQManager } from './dlq-manager'
import { WorkerCreationError } from './errors'

export type SubscriberInfo = {
  topic: string
  stepName: string
  queueConfig?: QueueConfig
}

type WorkerInfo = {
  worker: Worker
  topic: string
  stepName: string
  handle: SubscriptionHandle
  queueConfig?: QueueConfig
}

type JobData<TData> = {
  topic: string
  data: TData
  traceId: string
  flows?: string[]
  messageGroupId?: string
}

export class WorkerManager {
  private readonly workers: Map<string, WorkerInfo> = new Map()
  private readonly topicSubscriptions: Map<string, Set<string>> = new Map()
  private readonly connection: Redis
  private readonly config: MergedConfig
  private readonly getQueueName: (topic: string, stepName: string) => string
  private readonly dlqManager: DLQManager | null

  constructor(
    connection: Redis,
    config: MergedConfig,
    getQueueName: (topic: string, stepName: string) => string,
    dlqManager?: DLQManager,
  ) {
    this.connection = connection
    this.config = config
    this.getQueueName = getQueueName
    this.dlqManager = dlqManager ?? null
  }

  createWorker<TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: QueueConfig,
  ): SubscriptionHandle {
    const id = uuidv4()
    const queueName = this.getQueueName(topic, stepName)

    this.addTopicSubscription(topic, id)

    const concurrency = options?.type === 'fifo' ? FIFO_CONCURRENCY : options?.concurrency || this.config.concurrency
    const attempts = options?.maxRetries != null ? options.maxRetries + 1 : this.config.defaultJobOptions.attempts
    const lockDuration = options?.visibilityTimeout ? options.visibilityTimeout * MILLISECONDS_PER_SECOND : undefined

    const worker = new Worker(
      queueName,
      async (job: Job<JobData<TData>>) => {
        const eventData = job.data
        const event = {
          topic: eventData.topic,
          data: eventData.data,
          traceId: eventData.traceId,
          flows: eventData.flows,
          messageGroupId: eventData.messageGroupId,
        } as Event<TData>
        await handler(event)
      },
      {
        connection: this.connection,
        prefix: this.config.prefix,
        concurrency,
        lockDuration,
        removeOnComplete: this.config.defaultJobOptions.removeOnComplete,
        removeOnFail: this.config.defaultJobOptions.removeOnFail,
      },
    )

    this.setupWorkerHandlers(worker, topic, stepName, attempts ?? 3)

    const handle: SubscriptionHandle = {
      topic,
      id,
      unsubscribe: async () => {
        await this.removeWorker(handle.id)
      },
    }

    const workerInfo: WorkerInfo = {
      worker,
      topic,
      stepName,
      handle,
      queueConfig: options,
    }

    this.workers.set(id, workerInfo)
    return handle
  }

  getSubscribers(topic: string): SubscriberInfo[] {
    const subscriptionIds = this.topicSubscriptions.get(topic)
    if (!subscriptionIds || subscriptionIds.size === 0) {
      return []
    }

    return Array.from(subscriptionIds)
      .map((id) => this.workers.get(id))
      .filter((info): info is WorkerInfo => info !== undefined)
      .map((info) => ({ topic: info.topic, stepName: info.stepName, queueConfig: info.queueConfig }))
  }

  getWorkerInfo(id: string): WorkerInfo | undefined {
    return this.workers.get(id)
  }

  async removeWorker(id: string): Promise<void> {
    const workerInfo = this.workers.get(id)
    if (!workerInfo) {
      return
    }

    this.removeTopicSubscription(workerInfo.topic, id)
    await workerInfo.worker.close()
    this.workers.delete(id)
  }

  async closeAll(): Promise<void> {
    const promises = Array.from(this.workers.values()).map((info) =>
      info.worker.close().catch((err) => {
        console.error(`[BullMQ] Error closing worker for topic ${info.topic}, step ${info.stepName}:`, err)
      }),
    )
    await Promise.allSettled(promises)
    this.workers.clear()
    this.topicSubscriptions.clear()
  }

  getSubscriptionCount(topic: string): number {
    return Array.from(this.workers.values()).filter((w) => w.topic === topic).length
  }

  listTopics(): string[] {
    return Array.from(new Set(Array.from(this.workers.values()).map((w) => w.topic)))
  }

  private addTopicSubscription(topic: string, id: string): void {
    if (!this.topicSubscriptions.has(topic)) {
      this.topicSubscriptions.set(topic, new Set())
    }
    this.topicSubscriptions.get(topic)?.add(id)
  }

  private removeTopicSubscription(topic: string, id: string): void {
    const subscriptions = this.topicSubscriptions.get(topic)
    if (subscriptions) {
      subscriptions.delete(id)
      if (subscriptions.size === 0) {
        this.topicSubscriptions.delete(topic)
      }
    }
  }

  private setupWorkerHandlers(worker: Worker, topic: string, stepName: string, attempts: number): void {
    worker.on('error', (err: Error) => {
      const error = new WorkerCreationError(topic, stepName, err)
      console.error(`[BullMQ] Worker error for topic ${topic}, step ${stepName}:`, error)
    })
    worker.on('failed', async (job: Job<JobData<unknown>> | undefined, err: Error) => {
      if (job) {
        const attemptsMade = job.attemptsMade || 0
        if (attemptsMade >= attempts) {
          if (this.dlqManager) {
            const eventData = job.data
            const event = {
              topic: eventData.topic || topic,
              data: eventData.data,
              traceId: eventData.traceId || 'unknown',
              ...(eventData.flows && { flows: eventData.flows }),
              ...(eventData.messageGroupId && { messageGroupId: eventData.messageGroupId }),
            } as Event<unknown>

            await this.dlqManager.moveToDLQ(topic, stepName, event, err, attemptsMade, job.id)
          }
        }
      }
    })
  }
}
