import type { BaseStreamItem, StateStreamEvent, StateStreamEventChannel } from '@motiadev/core'
import { StreamAdapter, type StreamQueryFilter } from '@motiadev/core'
import { createClient, type RedisClientOptions, type RedisClientType } from 'redis'
import type { RedisStreamAdapterConfig } from './types'

type StreamItemWithTimestamp<TData> = BaseStreamItem<TData> & {
  _createdAt?: number
}

type RedisSocketConfig = {
  host?: string
  port?: number
  keepAlive?: boolean
  noDelay?: boolean
}

type EventHandler<T> = (event: StateStreamEvent<T>) => void | Promise<void>

export class RedisStreamAdapter<TData> extends StreamAdapter<TData> {
  private client: RedisClientType
  private subClient?: RedisClientType
  private keyPrefix: string
  private groupPrefix: string
  private subscriptions: Map<string, EventHandler<unknown>> = new Map()

  constructor(streamName: string, config: RedisStreamAdapterConfig, sharedClient: RedisClientType) {
    super(streamName)
    this.keyPrefix = config.keyPrefix || 'motia:stream:'
    this.groupPrefix = `${this.keyPrefix}${streamName}:group:`

    this.client = sharedClient
  }

  private makeGroupKey(groupId: string): string {
    return `${this.groupPrefix}${groupId}`
  }

  private makeChannelKey(channel: StateStreamEventChannel): string {
    return channel.id
      ? `motia:stream:events:${this.streamName}:${channel.groupId}:${channel.id}`
      : `motia:stream:events:${this.streamName}:${channel.groupId}`
  }

  async get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const hashKey = this.makeGroupKey(groupId)
    const value = await this.client.hGet(hashKey, id)
    return value ? JSON.parse(value) : null
  }

  async set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>> {
    const hashKey = this.makeGroupKey(groupId)
    const dataWithTimestamp = data as StreamItemWithTimestamp<TData>
    const item: StreamItemWithTimestamp<TData> = {
      ...data,
      id,
      _createdAt: dataWithTimestamp._createdAt || Date.now(),
    }
    const itemJson = JSON.stringify(item)

    const existed = await this.client.hExists(hashKey, id)
    const eventType = existed ? 'update' : 'create'

    await Promise.all([
      this.client.hSet(hashKey, id, itemJson),
      this.send({ groupId, id }, { type: eventType, data: item }),
    ])

    return item
  }

  async delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const hashKey = this.makeGroupKey(groupId)
    const value = await this.client.hGet(hashKey, id)

    if (!value) return null

    const item = JSON.parse(value) as BaseStreamItem<TData>

    await Promise.all([this.client.hDel(hashKey, id), this.send({ groupId, id }, { type: 'delete', data: item })])

    return item
  }

  async getGroup(groupId: string): Promise<BaseStreamItem<TData>[]> {
    const hashKey = this.makeGroupKey(groupId)
    const values = await this.client.hGetAll(hashKey)

    const items = Object.values(values).map((v) => JSON.parse(v) as StreamItemWithTimestamp<TData>)

    return items.sort((a, b) => {
      const aTime = a._createdAt || 0
      const bTime = b._createdAt || 0
      return aTime - bTime
    })
  }

  async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void> {
    const channelKey = this.makeChannelKey(channel)
    await this.client.publish(channelKey, JSON.stringify(event))
  }

  async subscribe<T>(
    channel: StateStreamEventChannel,
    handler: (event: StateStreamEvent<T>) => void | Promise<void>,
  ): Promise<void> {
    const channelKey = this.makeChannelKey(channel)

    if (!this.subClient) {
      const socketConfig = this.client.options?.socket as RedisSocketConfig | undefined
      const keepAliveValue = socketConfig?.keepAlive
      const clientConfig: RedisClientOptions = {
        socket: {
          host: socketConfig?.host || 'localhost',
          port: socketConfig?.port || 6379,
          keepAlive: keepAliveValue,
          noDelay: true,
        },
        password: this.client.options?.password,
        username: this.client.options?.username,
        database: this.client.options?.database || 0,
      }
      this.subClient = createClient(clientConfig) as RedisClientType

      this.subClient.on('error', (err) => {
        console.error('[Redis Stream] Sub client error:', err)
      })

      await this.subClient.connect()
    }

    this.subscriptions.set(channelKey, handler as EventHandler<unknown>)

    const subClient = this.subClient
    if (!subClient) return

    await subClient.subscribe(channelKey, async (message) => {
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
    const hashKey = this.makeGroupKey(groupId)
    await this.client.del(hashKey)
  }

  async query(groupId: string, filter: StreamQueryFilter<TData>): Promise<BaseStreamItem<TData>[]> {
    let items = await this.getGroup(groupId)

    if (filter.where) {
      const where = filter.where
      items = items.filter((item) => {
        return Object.entries(where).every(([key, value]) => {
          const itemKey = key as keyof BaseStreamItem<TData>
          return item[itemKey] === value
        })
      })
    }

    if (filter.orderBy) {
      items.sort((a, b) => {
        const orderKey = filter.orderBy as keyof BaseStreamItem<TData>
        const aVal = a[orderKey]
        const bVal = b[orderKey]
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

  async cleanup(): Promise<void> {
    this.subscriptions.clear()
  }
}
