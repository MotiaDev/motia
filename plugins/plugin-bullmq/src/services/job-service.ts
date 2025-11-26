import { type Job, Queue } from 'bullmq'
import type { Redis, RedisOptions } from 'ioredis'
import IORedis from 'ioredis'
import type { DLQJobInfo, JobInfo, JobProgress, JobStatus } from '../types/queue'

export class JobService {
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

  private mapJobToInfo(job: Job): JobInfo {
    return {
      id: job.id ?? '',
      name: job.name,
      data: job.data,
      opts: job.opts as Record<string, unknown>,
      progress: job.progress as JobProgress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      delay: job.delay,
    }
  }

  async getJobs(queueName: string, status: JobStatus | JobStatus[], start = 0, end = 100): Promise<JobInfo[]> {
    const queue = this.getQueue(queueName)
    const statuses = Array.isArray(status) ? status : [status]
    const jobStates = statuses.map((s) => (s === 'waiting' ? 'wait' : s))
    const jobs = await queue.getJobs(jobStates, start, end)
    return jobs.map((job) => this.mapJobToInfo(job))
  }

  async getJob(queueName: string, jobId: string): Promise<JobInfo | null> {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)
    if (!job) return null
    return this.mapJobToInfo(job)
  }

  async retryJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)
    if (job) {
      await job.retry()
    }
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)
    if (job) {
      await job.remove()
    }
  }

  async promoteJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)
    if (job) {
      await job.promote()
    }
  }

  async getDLQJobs(queueName: string, start = 0, end = 100): Promise<DLQJobInfo[]> {
    const queue = this.getQueue(queueName)
    const jobs = await queue.getJobs(['waiting', 'failed'], start, end)
    return jobs.map((job) => ({
      id: job.id ?? '',
      originalEvent: job.data.originalEvent,
      failureReason: job.data.failureReason,
      failureTimestamp: job.data.failureTimestamp,
      attemptsMade: job.data.attemptsMade,
      originalJobId: job.data.originalJobId,
    }))
  }

  async retryFromDLQ(dlqQueueName: string, jobId: string): Promise<void> {
    const dlqQueue = this.getQueue(dlqQueueName)
    const job = await dlqQueue.getJob(jobId)
    if (!job) return

    const originalQueueName = dlqQueueName.replace(this.dlqSuffix, '')
    const originalQueue = this.getQueue(originalQueueName)

    const { originalEvent } = job.data
    await originalQueue.add(originalEvent.topic, originalEvent.data, {
      jobId: job.data.originalJobId ? `retry:${job.data.originalJobId}` : undefined,
    })

    await job.remove()
  }

  async retryAllFromDLQ(dlqQueueName: string): Promise<number> {
    const jobs = await this.getDLQJobs(dlqQueueName, 0, -1)
    let retried = 0
    for (const job of jobs) {
      await this.retryFromDLQ(dlqQueueName, job.id)
      retried++
    }
    return retried
  }

  async clearDLQ(dlqQueueName: string): Promise<void> {
    const queue = this.getQueue(dlqQueueName)
    await queue.obliterate({ force: true })
  }

  async close(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((q) => q.close())
    await Promise.allSettled(closePromises)
    this.queues.clear()
  }
}
