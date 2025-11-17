import {
  DEFAULT_ATTEMPTS,
  DEFAULT_BACKOFF_DELAY,
  DEFAULT_CONCURRENCY,
  DEFAULT_DLQ_ENABLED,
  DEFAULT_DLQ_SUFFIX,
  DEFAULT_PREFIX,
  DEFAULT_REMOVE_ON_COMPLETE_COUNT,
  DEFAULT_REMOVE_ON_FAIL_COUNT,
} from './constants'
import type { BullMQEventAdapterConfig } from './types'

export type MergedConfig = Required<
  Pick<BullMQEventAdapterConfig, 'defaultJobOptions' | 'prefix' | 'concurrency' | 'deadLetterQueue'>
>

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
    deadLetterQueue: {
      enabled: config.deadLetterQueue?.enabled ?? DEFAULT_DLQ_ENABLED,
      suffix: config.deadLetterQueue?.suffix ?? DEFAULT_DLQ_SUFFIX,
      maxJobAge: config.deadLetterQueue?.maxJobAge,
    },
  }
}
