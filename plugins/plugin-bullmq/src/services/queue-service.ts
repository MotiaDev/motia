import { Queue } from 'bullmq'
import type { Redis, RedisOptions } from 'ioredis'
import IORedis from 'ioredis'
import type { CleanOptions, JobStatus, QueueInfo, QueueStats } from '../types/queue'

export class QueueService {
  private readonly connection: Redis
  private readonly queues: Map<string, Queue> = new Map()
  private readonly prefix: string
  private readonly dlqSuffix: string

  constructor(connection: Redis | RedisOptions, prefix = 'motia:events', dlqSuffix = '.dlq') {
    this.connection = connection instanceof IORedis ? connection : new IORedis(connection)
    this.prefix = prefix
    this.dlqSuffix = dlqSuffix
  }

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.connection,
        prefix: this.prefix,
      })
      this.queues.set(name, queue)
    }
    return this.queues.get(name) as Queue
  }

  async discoverQueues(): Promise<string[]> {
    const pattern = `${this.prefix}:*:id`
    const keys = await this.connection.keys(pattern)
    const prefixWithColon = `${this.prefix}:`

    const queueNames = new Set<string>()
    for (const key of keys) {
      if (key.startsWith(prefixWithColon) && key.endsWith(':id')) {
        const withoutPrefix = key.slice(prefixWithColon.length)
        const queueName = withoutPrefix.slice(0, -3)
        if (queueName) {
          queueNames.add(queueName)
        }
      }
    }

    return Array.from(queueNames).sort()
  }

  async getQueueStats(name: string): Promise<QueueStats> {
    const queue = this.getQueue(name)
    const counts = await queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
      'prioritized',
    )
    return counts as QueueStats
  }

  async getQueueInfo(name: string): Promise<QueueInfo> {
    const queue = this.getQueue(name)
    const [stats, isPaused] = await Promise.all([this.getQueueStats(name), queue.isPaused()])

    const isDLQ = name.endsWith(this.dlqSuffix)
    const displayName = isDLQ ? `${name.replace(this.dlqSuffix, '')} (DLQ)` : name

    return {
      name,
      displayName,
      isPaused,
      isDLQ,
      stats,
    }
  }

  async getAllQueues(): Promise<QueueInfo[]> {
    const queueNames = await this.discoverQueues()
    const queues = await Promise.all(queueNames.map((name) => this.getQueueInfo(name)))
    return queues
  }

  async pauseQueue(name: string): Promise<void> {
    const queue = this.getQueue(name)
    await queue.pause()
  }

  async resumeQueue(name: string): Promise<void> {
    const queue = this.getQueue(name)
    await queue.resume()
  }

  async cleanQueue(name: string, options: CleanOptions): Promise<string[]> {
    const queue = this.getQueue(name)
    const jobStates: Record<
      JobStatus,
      'wait' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'prioritized'
    > = {
      waiting: 'wait',
      active: 'active',
      completed: 'completed',
      failed: 'failed',
      delayed: 'delayed',
      paused: 'paused',
      prioritized: 'prioritized',
    }
    const state = jobStates[options.status]
    const deletedJobIds = await queue.clean(options.grace, options.limit, state)
    return deletedJobIds
  }

  async drainQueue(name: string): Promise<void> {
    const queue = this.getQueue(name)
    await queue.drain()
  }

  async obliterateQueue(name: string): Promise<void> {
    const queue = this.getQueue(name)
    await queue.obliterate({ force: true })
    this.queues.delete(name)
  }

  async close(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((q) => q.close())
    await Promise.allSettled(closePromises)
    this.queues.clear()
    await this.connection.quit()
  }

  isDLQQueue(name: string): boolean {
    return name.endsWith(this.dlqSuffix)
  }

  getOriginalQueueName(dlqName: string): string {
    return dlqName.replace(this.dlqSuffix, '')
  }
}
