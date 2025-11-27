import type { Event } from '@motiadev/core'
import { Queue } from 'bullmq'
import type { Redis } from 'ioredis'
import type { MergedConfig } from './config-builder'
import { DLQ_JOB_PREFIX, LOG_PREFIX, MILLISECONDS_PER_SECOND } from './constants'
import { QueueCreationError } from './errors'

type DLQJobData<TData> = {
  originalEvent: Event<TData>
  failureReason: string
  failureTimestamp: number
  attemptsMade: number
  originalJobId?: string
}

export class DLQManager {
  private readonly dlqQueues: Map<string, Queue> = new Map()
  private readonly connection: Redis
  private readonly config: MergedConfig

  constructor(connection: Redis, config: MergedConfig) {
    this.connection = connection
    this.config = config
  }

  getDLQQueueName(topic: string, stepName: string): string {
    const baseQueueName = `${topic}.${stepName}`
    return `${baseQueueName}${this.config.dlq.suffix}`
  }

  private getOrCreateDLQQueue(queueName: string): Queue {
    if (!this.dlqQueues.has(queueName)) {
      const ttlMs = this.config.dlq.ttl * MILLISECONDS_PER_SECOND
      const queue = new Queue(queueName, {
        connection: this.connection,
        prefix: this.config.prefix,
        defaultJobOptions: {
          removeOnComplete: {
            age: ttlMs,
          },
          removeOnFail: {
            age: ttlMs,
          },
        },
      })

      queue.on('error', (err: Error) => {
        console.error(`${LOG_PREFIX} DLQ error for ${queueName}:`, err)
      })

      this.dlqQueues.set(queueName, queue)
    }

    const queue = this.dlqQueues.get(queueName)
    if (!queue) {
      throw new QueueCreationError(queueName)
    }
    return queue
  }

  async moveToDLQ<TData>(
    topic: string,
    stepName: string,
    event: Event<TData>,
    error: Error,
    attemptsMade: number,
    originalJobId?: string,
  ): Promise<void> {
    if (!this.config.dlq!.enabled) {
      console.warn(`${LOG_PREFIX} DLQ is disabled, skipping move to DLQ for topic ${topic}, step ${stepName}`)
      return
    }

    try {
      const dlqQueueName = this.getDLQQueueName(topic, stepName)
      const dlqQueue = this.getOrCreateDLQQueue(dlqQueueName)

      const sanitizedEvent = {
        topic: event.topic,
        data: event.data,
        traceId: event.traceId || 'unknown',
        ...(event.flows && { flows: event.flows }),
        ...(event.messageGroupId && { messageGroupId: event.messageGroupId }),
      } as Event<TData>

      const dlqJobData: DLQJobData<TData> = {
        originalEvent: sanitizedEvent,
        failureReason: error.message || 'Unknown error',
        failureTimestamp: Date.now(),
        attemptsMade,
        ...(originalJobId && { originalJobId }),
      }

      const jobOptions = originalJobId ? { jobId: `${DLQ_JOB_PREFIX}${originalJobId}` } : {}

      await dlqQueue.add(`${topic}.dlq`, dlqJobData, jobOptions)

      console.warn(`${LOG_PREFIX} Moved failed job to DLQ: ${dlqQueueName}`, {
        topic,
        stepName,
        attemptsMade,
        error: error.message,
      })
    } catch (err) {
      const dlqError = err instanceof Error ? err : new Error(String(err))
      console.error(`${LOG_PREFIX} Failed to move job to DLQ for topic ${topic}, step ${stepName}:`, dlqError)
    }
  }

  async closeDLQQueue(queueName: string): Promise<void> {
    const queue = this.dlqQueues.get(queueName)
    if (queue) {
      await queue.close()
      this.dlqQueues.delete(queueName)
    }
  }

  async closeAll(): Promise<void> {
    const promises = Array.from(this.dlqQueues.values()).map((queue) =>
      queue.close().catch((err) => {
        console.error(`${LOG_PREFIX} Error closing DLQ queue:`, err)
      }),
    )
    await Promise.allSettled(promises)
    this.dlqQueues.clear()
  }

  getDLQQueue(queueName: string): Queue | undefined {
    return this.dlqQueues.get(queueName)
  }

  getOrCreateDLQ(queueName: string): Queue {
    return this.getOrCreateDLQQueue(queueName)
  }

  listDLQQueueNames(): string[] {
    return Array.from(this.dlqQueues.keys())
  }

  getDLQSuffix(): string {
    return this.config.dlq.suffix
  }

  getPrefix(): string {
    return this.config.prefix
  }

  getConnection(): Redis {
    return this.connection
  }
}
