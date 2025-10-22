export interface RedisStateAdapterConfig {
  host?: string
  port?: number
  password?: string
  username?: string
  database?: number
  keyPrefix?: string
  ttl?: number
  socket?: {
    reconnectStrategy?: (retries: number) => number | Error
    connectTimeout?: number
  }
}
