export const DEFAULT_CONCURRENCY = 10
export const DEFAULT_ATTEMPTS = 3
export const DEFAULT_BACKOFF_DELAY = 2000
export const DEFAULT_REMOVE_ON_COMPLETE_COUNT = 1000
export const DEFAULT_REMOVE_ON_FAIL_COUNT = 5000
export const DEFAULT_PREFIX = 'motia'
export const FIFO_CONCURRENCY = 1
export const MILLISECONDS_PER_SECOND = 1000
export const SECONDS_PER_DAY = 86400
export const DEFAULT_DLQ_TTL = 30 * SECONDS_PER_DAY
export const DEFAULT_DLQ_SUFFIX = '.dlq'
export const DLQ_JOB_PREFIX = 'dlq-'

export const LOG_PREFIX = '[BullMQ]'
