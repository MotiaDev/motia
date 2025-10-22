export interface RedisStreamAdapterConfig {
  host?: string
  port?: number
  password?: string
  username?: string
  database?: number
  keyPrefix?: string
  socket?: {
    reconnectStrategy?: (retries: number) => number | Error
    connectTimeout?: number
  }
}
