import type { Event, EventAdapter, QueueConfig, SubscriptionHandle } from '@motiadev/core'
import { type Job, Queue, Worker } from 'bullmq'
import IORedis, { type Redis } from 'ioredis'
import type { BullMQEventAdapterConfig } from './types'

type WorkerInfo = {
  worker: Worker
  topic: string
  stepName: string
  handle: SubscriptionHandle
}

export class BullMQEventAdapter implements EventAdapter {
  private connection: Redis
  private queues: Map<string, Queue> = new Map()
  private workers: Map<string, WorkerInfo> = new Map()
  private topicSubscriptions: Map<string, Set<string>> = new Map()
  private config: Required<Pick<BullMQEventAdapterConfig, 'defaultJobOptions' | 'prefix' | 'concurrency'>>
  private ownsConnection: boolean

  constructor(config: BullMQEventAdapterConfig) {
    if (config.connection instanceof IORedis) {
      this.connection = config.connection
      this.ownsConnection = false
    } else {
      this.connection = new IORedis({
        maxRetriesPerRequest: null,
        ...config.connection,
      })
      this.ownsConnection = true
    }

    this.config = {
      concurrency: config.concurrency ?? 5,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 2000,
        },
        removeOnComplete: {
          count: 1000,
        },
        removeOnFail: {
          count: 5000,
        },
        ...config.defaultJobOptions,
      },
      prefix: config.prefix || 'motia',
    }

    this.connection.on('error', (err: Error) => {
      console.error('[BullMQ] Connection error:', err)
    })

    this.connection.on('close', () => {
      console.warn('[BullMQ] Connection closed')
    })
  }

  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        prefix: this.config.prefix,
        defaultJobOptions: this.config.defaultJobOptions,
      })

      queue.on('error', (err: Error) => {
        console.error(`[BullMQ] Queue error for ${queueName}:`, err)
      })

      this.queues.set(queueName, queue)
    }
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Failed to create queue: ${queueName}`)
    }
    return queue
  }

  private getQueueName(topic: string, stepName: string): string {
    return `${topic}.${stepName}`
  }

  async emit<TData>(event: Event<TData>): Promise<void> {
    const subscriptionIds = this.topicSubscriptions.get(event.topic)
    if (!subscriptionIds || subscriptionIds.size === 0) {
      return
    }

    const jobData = {
      topic: event.topic,
      data: event.data,
      traceId: event.traceId,
      flows: event.flows,
      messageGroupId: event.messageGroupId,
    }

    const addPromises: Promise<void>[] = []

    for (const subscriptionId of subscriptionIds) {
      const workerInfo = this.workers.get(subscriptionId)
      if (workerInfo) {
        const queueName = this.getQueueName(workerInfo.topic, workerInfo.stepName)
        const queue = this.getQueue(queueName)
        const jobId = event.messageGroupId ? `${queueName}.${event.messageGroupId}` : undefined

        addPromises.push(
          queue
            .add(event.topic, jobData, {
              jobId,
            })
            .then(() => undefined),
        )
      }
    }

    await Promise.all(addPromises)
  }

  async subscribe<TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
    options?: QueueConfig,
  ): Promise<SubscriptionHandle> {
    const id = `${topic}:${stepName}`
    const queueName = this.getQueueName(topic, stepName)
    this.getQueue(queueName)

    if (!this.topicSubscriptions.has(topic)) {
      this.topicSubscriptions.set(topic, new Set())
    }
    const topicSubs = this.topicSubscriptions.get(topic)
    if (topicSubs) {
      topicSubs.add(id)
    }

    const concurrency = options?.type === 'fifo' ? 1 : this.config.concurrency

    const attempts = options?.maxRetries !== undefined ? options.maxRetries : this.config.defaultJobOptions.attempts

    const lockDuration = options?.visibilityTimeout ? options.visibilityTimeout * 1000 : undefined

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        const eventData = job.data as {
          topic: string
          data: TData
          traceId: string
          flows?: string[]
          messageGroupId?: string
        }

        const event: Event<TData> = {
          topic: eventData.topic,
          data: eventData.data,
          traceId: eventData.traceId,
          flows: eventData.flows,
          messageGroupId: eventData.messageGroupId,
        }

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

    worker.on('error', (err: Error) => {
      console.error(`[BullMQ] Worker error for topic ${topic}, step ${stepName}:`, err)
    })

    worker.on('failed', (job: Job | undefined, err: Error) => {
      if (job) {
        const attemptsMade = job.attemptsMade || 0
        if (attemptsMade >= (attempts || 1)) {
          console.error(`[BullMQ] Job ${job.id} failed after ${attemptsMade} attempts:`, err)
        }
      }
    })

    const handle: SubscriptionHandle = {
      topic,
      id,
      unsubscribe: async () => {
        await this.unsubscribe(handle)
      },
    }

    const workerInfo: WorkerInfo = {
      worker,
      topic,
      stepName,
      handle,
    }

    this.workers.set(id, workerInfo)

    return handle
  }

  async unsubscribe(handle: SubscriptionHandle): Promise<void> {
    const workerInfo = this.workers.get(handle.id)
    if (workerInfo) {
      const topicSubscriptions = this.topicSubscriptions.get(workerInfo.topic)
      if (topicSubscriptions) {
        topicSubscriptions.delete(handle.id)
        if (topicSubscriptions.size === 0) {
          this.topicSubscriptions.delete(workerInfo.topic)
        }
      }

      await workerInfo.worker.close()
      const queueName = this.getQueueName(workerInfo.topic, workerInfo.stepName)
      const queue = this.queues.get(queueName)
      if (queue) {
        await queue.close()
        this.queues.delete(queueName)
      }
      this.workers.delete(handle.id)
    }
  }

  async shutdown(): Promise<void> {
    const closePromises: Promise<void>[] = []

    for (const workerInfo of this.workers.values()) {
      closePromises.push(workerInfo.worker.close())
    }

    await Promise.all(closePromises)
    this.workers.clear()

    for (const queue of this.queues.values()) {
      closePromises.push(queue.close())
    }

    await Promise.all(closePromises)
    this.queues.clear()
    this.topicSubscriptions.clear()

    if (this.ownsConnection && this.connection && this.connection.status !== 'end') {
      await this.connection.quit()
    }
  }

  async getSubscriptionCount(topic: string): Promise<number> {
    return Array.from(this.workers.values()).filter((w) => w.topic === topic).length
  }

  async listTopics(): Promise<string[]> {
    return Array.from(new Set(Array.from(this.workers.values()).map((w) => w.topic)))
  }
}
