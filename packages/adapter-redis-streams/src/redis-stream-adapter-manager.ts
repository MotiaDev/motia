import type { StreamAdapter, StreamAdapterManager } from '@motiadev/core'
import { createClient, type RedisClientType } from 'redis'
import { RedisStreamAdapter } from './redis-stream-adapter'
import type { RedisStreamAdapterConfig } from './types'

export class RedisStreamAdapterManager implements StreamAdapterManager {
  private client: RedisClientType
  private connected = false

  constructor(private config: RedisStreamAdapterConfig) {
    const clientConfig = {
      socket: {
        host: config.host || 'localhost',
        port: config.port || 6379,
        reconnectStrategy:
          config.socket?.reconnectStrategy ||
          ((retries: number): number | Error => {
            if (retries > 10) {
              return new Error('Redis connection retry limit exceeded')
            }
            return Math.min(retries * 100, 3000)
          }),
        connectTimeout: config.socket?.connectTimeout || 10000,
      },
      password: config.password,
      username: config.username,
      database: config.database || 0,
    }

    this.client = createClient(clientConfig)

    this.client.on('error', (err) => {
      console.error('[Redis Stream Manager] Client error:', err)
    })

    this.client.on('connect', () => {
      this.connected = true
    })

    this.client.on('disconnect', () => {
      console.warn('[Redis Stream Manager] Disconnected')
      this.connected = false
    })

    this.connect()
  }

  private async connect(): Promise<void> {
    if (!this.connected) {
      try {
        await this.client.connect()
      } catch (error) {
        console.error('[Redis Stream Manager] Failed to connect:', error)
        throw error
      }
    }
  }

  createStream<TData>(streamName: string): StreamAdapter<TData> {
    return new RedisStreamAdapter<TData>(streamName, this.config, this.client)
  }

  async shutdown(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit()
    }
  }
}
