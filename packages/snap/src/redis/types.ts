import type { RedisClientType } from 'redis'

export interface RedisConnectionInfo {
  host: string
  port: number
}

export interface RedisManager {
  connect(baseDir: string): Promise<RedisClientType>
  stop(): Promise<void>
  isRunning(): boolean
  getClient(): RedisClientType | null
}
