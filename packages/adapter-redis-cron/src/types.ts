export interface RedisCronAdapterOptions {
  keyPrefix?: string
  lockTTL?: number
  lockRetryDelay?: number
  lockRetryAttempts?: number
  instanceId?: string
  enableHealthCheck?: boolean
}
