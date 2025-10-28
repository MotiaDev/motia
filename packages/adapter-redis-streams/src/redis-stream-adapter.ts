import type { BaseStreamItem, StateStreamEvent, StateStreamEventChannel } from '@motiadev/core'
import { StreamAdapter, type StreamQueryFilter } from '@motiadev/core'
import { createClient, type RedisClientType } from 'redis'
import type { RedisStreamAdapterConfig } from './types'

export class RedisStreamAdapter<TData> extends StreamAdapter<TData> {
  private client: RedisClientType
  private pubClient: RedisClientType
  private subClient?: RedisClientType
  private keyPrefix: string
  private connected = false
  private subscriptions: Map<string, (event: StateStreamEvent<any>) => void | Promise<void>> = new Map()

  constructor(config: RedisStreamAdapterConfig) {
    super()
    this.keyPrefix = config.keyPrefix || 'motia:stream:'

    const clientConfig = {
      socket: {
        host: config.host || 'localhost',
        port: config.port || 6379,
        reconnectStrategy:
          config.socket?.reconnectStrategy ||
          ((retries) => {
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
    this.pubClient = createClient(clientConfig)

    this.client.on('error', (err) => {
      console.error('[Redis Stream] Client error:', err)
    })

    this.client.on('connect', () => {
      this.connected = true
    })

    this.client.on('disconnect', () => {
      console.warn('[Redis Stream] Disconnected')
      this.connected = false
    })

    this.pubClient.on('error', (err) => {
      console.error('[Redis Stream] Pub client error:', err)
    })

    this.connect()
  }

  private async connect(): Promise<void> {
    if (!this.connected) {
      try {
        await Promise.all([this.client.connect(), this.pubClient.connect()])
      } catch (error) {
        console.error('[Redis Stream] Failed to connect:', error)
        throw error
      }
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen || !this.pubClient.isOpen) {
      await this.connect()
    }
  }

  private makeKey(groupId: string, id?: string): string {
    return id ? `${this.keyPrefix}${groupId}:${id}` : `${this.keyPrefix}${groupId}`
  }

  private makeChannelKey(channel: StateStreamEventChannel): string {
    return channel.id
      ? `motia:stream:events:${channel.groupId}:${channel.id}`
      : `motia:stream:events:${channel.groupId}`
  }

  async get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    await this.ensureConnected()
    const key = this.makeKey(groupId, id)
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  async set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>> {
    await this.ensureConnected()
    const key = this.makeKey(groupId, id)
    const item: BaseStreamItem<TData> = { ...data, id } as BaseStreamItem<TData>
    await this.client.set(key, JSON.stringify(item))

    await this.send({ groupId, id }, { type: 'update', data: item })

    return item
  }

  async delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    await this.ensureConnected()
    const item = await this.get(groupId, id)
    if (item) {
      const key = this.makeKey(groupId, id)
      await this.client.del(key)
      await this.send({ groupId, id }, { type: 'delete', data: item })
    }
    return item
  }

  async getGroup(groupId: string): Promise<BaseStreamItem<TData>[]> {
    await this.ensureConnected()
    const pattern = `${this.makeKey(groupId)}:*`
    const keys = await this.scanKeys(pattern)

    if (keys.length === 0) return []

    const values = await this.client.mGet(keys)
    return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v))
  }

  async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void> {
    await this.ensureConnected()
    const channelKey = this.makeChannelKey(channel)
    await this.pubClient.publish(channelKey, JSON.stringify(event))
  }

  async subscribe<T>(
    channel: StateStreamEventChannel,
    handler: (event: StateStreamEvent<T>) => void | Promise<void>,
  ): Promise<void> {
    const channelKey = this.makeChannelKey(channel)

    if (!this.subClient) {
      const socketConfig = this.client.options?.socket as any
      const clientConfig = {
        socket: {
          host: socketConfig?.host || 'localhost',
          port: socketConfig?.port || 6379,
        },
        password: this.client.options?.password,
        username: this.client.options?.username,
        database: this.client.options?.database || 0,
      }
      this.subClient = createClient(clientConfig)

      this.subClient.on('error', (err) => {
        console.error('[Redis Stream] Sub client error:', err)
      })

      await this.subClient.connect()
    }

    this.subscriptions.set(channelKey, handler as (event: StateStreamEvent<any>) => void | Promise<void>)

    await this.subClient.subscribe(channelKey, async (message) => {
      try {
        const event = JSON.parse(message) as StateStreamEvent<T>
        await handler(event)
      } catch (error) {
        console.error('[Redis Stream] Error processing subscription message:', error)
      }
    })
  }

  async unsubscribe(channel: StateStreamEventChannel): Promise<void> {
    if (!this.subClient) return

    const channelKey = this.makeChannelKey(channel)
    this.subscriptions.delete(channelKey)

    try {
      await this.subClient.unsubscribe(channelKey)
    } catch (error) {
      console.error('[Redis Stream] Error unsubscribing:', error)
    }
  }

  async clear(groupId: string): Promise<void> {
    await this.ensureConnected()
    const pattern = `${this.makeKey(groupId)}:*`
    const keys = await this.scanKeys(pattern)

    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async query(groupId: string, filter: StreamQueryFilter<TData>): Promise<BaseStreamItem<TData>[]> {
    let items = await this.getGroup(groupId)

    if (filter.where) {
      items = items.filter((item) => {
        return Object.entries(filter.where!).every(([key, value]) => {
          return (item as any)[key] === value
        })
      })
    }

    if (filter.orderBy) {
      items.sort((a, b) => {
        const aVal = (a as any)[filter.orderBy!]
        const bVal = (b as any)[filter.orderBy!]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return filter.orderDirection === 'desc' ? -comparison : comparison
      })
    }

    if (filter.offset) {
      items = items.slice(filter.offset)
    }

    if (filter.limit) {
      items = items.slice(0, filter.limit)
    }

    return items
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = []
    let cursor = 0

    do {
      const result = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      })
      cursor = result.cursor
      keys.push(...result.keys)
    } while (cursor !== 0)

    return keys
  }

  async cleanup(): Promise<void> {
    if (this.subClient?.isOpen) {
      await this.subClient.quit()
    }
    if (this.pubClient.isOpen) {
      await this.pubClient.quit()
    }
    if (this.client.isOpen) {
      await this.client.quit()
    }
    this.subscriptions.clear()
  }
}
