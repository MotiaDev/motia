import type { Event } from '@motiadev/core'
import { Queue } from 'bullmq'
import type { Redis } from 'ioredis'
import type { MergedConfig } from './config-builder'
import { MILLISECONDS_PER_SECOND } from './constants'
import { QueueCreationError } from './errors'
import type { SubscriberInfo } from './worker-manager'

export class QueueManager {
  private readonly queues: Map<string, Queue> = new Map()
  private readonly connection: Redis
  private readonly config: MergedConfig

  constructor(connection: Redis, config: MergedConfig) {
    this.connection = connection
    this.config = config
  }

  getQueue(queueName: string): Queue {
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
      throw new QueueCreationError(queueName)
    }
    return queue
  }

  getQueueName(topic: string, stepName: string): string {
    return `${topic}.${stepName}`
  }

  async enqueueToAll<TData>(event: Event<TData>, subscribers: SubscriberInfo[]): Promise<void> {
    const promises = subscribers.map((subscriber) => {
      const queueName = this.getQueueName(subscriber.topic, subscriber.stepName)
      const queue = this.getQueue(queueName)
      const jobId = event.messageGroupId ? `${queueName}.${event.messageGroupId}` : undefined

      const jobData = {
        topic: event.topic,
        data: event.data,
        traceId: event.traceId,
        flows: event.flows,
        messageGroupId: event.messageGroupId,
      }

      const maxRetries = subscriber.queueConfig?.maxRetries
      const attempts = maxRetries != null ? maxRetries + 1 : this.config.defaultJobOptions.attempts
      const delay = subscriber.queueConfig?.delaySeconds
        ? subscriber.queueConfig.delaySeconds * MILLISECONDS_PER_SECOND
        : undefined

      const jobOptions = {
        jobId,
        attempts,
        backoff: this.config.defaultJobOptions.backoff,
        delay,
      }

      return queue.add(event.topic, jobData, jobOptions).then(() => undefined)
    })

    await Promise.all(promises)
  }

  async closeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (queue) {
      await queue.close()
      this.queues.delete(queueName)
    }
  }

  async closeAll(): Promise<void> {
    const promises = Array.from(this.queues.values()).map((queue) =>
      queue.close().catch((err) => {
        console.error(`[BullMQ] Error closing queue:`, err)
      }),
    )
    await Promise.allSettled(promises)
    this.queues.clear()
  }

  listQueueNames(): string[] {
    return Array.from(this.queues.keys())
  }

  getPrefix(): string {
    return this.config.prefix
  }

  getConnection(): Redis {
    return this.connection
  }
}
