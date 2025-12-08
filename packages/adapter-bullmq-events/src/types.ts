import type { KeepJobs } from 'bullmq'
import type { Redis, RedisOptions } from 'ioredis'

export type BullMQConnectionConfig = Redis | RedisOptions

export interface BullMQEventAdapterConfig {
  connection: BullMQConnectionConfig
  concurrency?: number
  defaultJobOptions?: {
    attempts?: number
    backoff?: {
      type: 'fixed' | 'exponential'
      delay: number
    }
    removeOnComplete?: KeepJobs
    removeOnFail?: KeepJobs
  }
  prefix?: string
  dlq?: {
    enabled?: boolean
    ttl?: number
    suffix?: string
  }
}
