import type { StreamAdapter, StreamAdapterManager } from '@motiadev/core'
import { createClient, type RedisClientOptions, type RedisClientType } from 'redis'
import { RedisStreamAdapter } from './redis-stream-adapter'
import type { RedisStreamAdapterConfig, RedisStreamAdapterOptions } from './types'

function isRedisClient(input: RedisClientType | RedisClientOptions): input is RedisClientType {
  return typeof input === 'object' && 'isOpen' in input && 'connect' in input
}

export class RedisStreamAdapterManager implements StreamAdapterManager {
  private client: RedisClientType
  private connected = false
  private isExternalClient: boolean
  private config: RedisStreamAdapterConfig

  constructor(redisConnection: RedisClientType | RedisClientOptions, options?: RedisStreamAdapterOptions) {
    this.config = {
      keyPrefix: options?.keyPrefix || 'motia:stream:',
      socketKeepAlive: options?.socketKeepAlive ?? true,
    }

    if (isRedisClient(redisConnection)) {
      this.client = redisConnection
      this.isExternalClient = true
      this.connected = this.client.isOpen
    } else {
      const config: RedisClientOptions = {
        ...redisConnection,
        socket: {
          ...(redisConnection.socket || {}),
          keepAlive: this.config.socketKeepAlive,
          noDelay: true,
        },
      } as RedisClientOptions
      this.isExternalClient = false

      this.client = createClient(config) as RedisClientType

      this.client.on('error', (err) => {
        if (this.connected) {
          console.error('[Redis Stream Manager] Client error:', err?.message)
        }
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
  }

  private async connect(): Promise<void> {
    if (!this.connected && !this.isExternalClient) {
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

  getClient(): RedisClientType {
    return this.client
  }

  async shutdown(): Promise<void> {
    if (!this.isExternalClient && this.client.isOpen) {
      await this.client.quit()
    }
  }
}
