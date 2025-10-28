export interface RedisCronAdapterConfig {
  host?: string
  port?: number
  password?: string
  username?: string
  database?: number
  keyPrefix?: string
  lockTTL?: number
  lockRetryDelay?: number
  lockRetryAttempts?: number
  instanceId?: string
  enableHealthCheck?: boolean
  socket?: {
    reconnectStrategy?: (retries: number) => number | Error
    connectTimeout?: number
  }
}
