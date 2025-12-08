import { createClient, type RedisClientType } from 'redis'
import type { LoadedMotiaConfig } from '../load-motia-config'
import { RedisMemoryManager } from './memory-manager'
import type { RedisConnectionInfo } from './types'
import { isExternalRedisConfig, shouldUseMemoryServer } from './utils'

export type { RedisConnectionInfo } from './types'

class RedisConnectionManager {
  private client: RedisClientType | null = null

  private async getConnectionInfo(baseDir: string, config: LoadedMotiaConfig): Promise<RedisConnectionInfo> {
    if (shouldUseMemoryServer(config)) {
      return await new RedisMemoryManager().startServer(baseDir)
    }
    if (isExternalRedisConfig(config.redis)) {
      return { host: config.redis.host, port: config.redis.port }
    }
    return { host: process.env.MOTIA_REDIS_HOST || '127.0.0.1', port: parseInt(process.env.MOTIA_REDIS_PORT || '6379') }
  }

  async connect(baseDir: string, config: LoadedMotiaConfig): Promise<RedisClientType> {
    if (this.client) {
      return this.client
    }

    const { host, port } = await this.getConnectionInfo(baseDir, config)

    this.client = createClient({
      socket: {
        host,
        port,
        noDelay: true,
        keepAlive: true,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            return new Error('Redis connection retry limit exceeded')
          }
          return Math.min(retries * 100, 3000)
        },
        connectTimeout: 10000,
      },
    })

    await this.client.connect()

    return this.client
  }

  async stop(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit().catch(() => {
        console.error('[Redis Connection] Redis client closed')
      })
      this.client = null
    }
  }

  isRunning(): boolean {
    return !!this.client?.isOpen
  }

  getClient(): RedisClientType | null {
    return this.client
  }
}

const manager = new RedisConnectionManager()

export const getRedisClient = (baseDir: string, config: LoadedMotiaConfig): Promise<RedisClientType> =>
  manager.connect(baseDir, config)

export const stopRedisConnection = (): Promise<void> => manager.stop()
