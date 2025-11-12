import {
  DEFAULT_ATTEMPTS,
  DEFAULT_BACKOFF_DELAY,
  DEFAULT_CONCURRENCY,
  DEFAULT_PREFIX,
  DEFAULT_REMOVE_ON_COMPLETE_COUNT,
  DEFAULT_REMOVE_ON_FAIL_COUNT,
} from './constants'
import type { BullMQEventAdapterConfig } from './types'

export type MergedConfig = Required<Pick<BullMQEventAdapterConfig, 'defaultJobOptions' | 'prefix' | 'concurrency'>>

export function buildConfig(config: BullMQEventAdapterConfig): MergedConfig {
  return {
    concurrency: config.concurrency ?? DEFAULT_CONCURRENCY,
    defaultJobOptions: {
      attempts: DEFAULT_ATTEMPTS,
      backoff: {
        type: 'fixed',
        delay: DEFAULT_BACKOFF_DELAY,
      },
      removeOnComplete: {
        count: DEFAULT_REMOVE_ON_COMPLETE_COUNT,
      },
      removeOnFail: {
        count: DEFAULT_REMOVE_ON_FAIL_COUNT,
      },
      ...config.defaultJobOptions,
    },
    prefix: config.prefix ?? DEFAULT_PREFIX,
  }
}
