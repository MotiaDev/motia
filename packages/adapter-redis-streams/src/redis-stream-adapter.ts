import type { BaseStreamItem, StateStreamEvent, StateStreamEventChannel } from '@motiadev/core'
import { StreamAdapter, type StreamQueryFilter } from '@motiadev/core'
import { createClient, type RedisClientType } from 'redis'
import type { RedisStreamAdapterConfig } from './types'

export class RedisStreamAdapter<TData> extends StreamAdapter<TData> {
  private client: RedisClientType
  private subClient?: RedisClientType
  private keyPrefix: string
  private groupPrefix: string
  private subscriptions: Map<string, (event: StateStreamEvent<any>) => void | Promise<void>> = new Map()

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
    const item: BaseStreamItem<TData> = {
      ...data,
      id,
      _createdAt: (data as any)._createdAt || Date.now(),
    } as BaseStreamItem<TData>
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

    const items = Object.values(values).map((v) => JSON.parse(v) as BaseStreamItem<TData>)

    return items.sort((a, b) => {
      const aTime = (a as any)._createdAt || 0
      const bTime = (b as any)._createdAt || 0
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
      const socketConfig = this.client.options?.socket as any
      const clientConfig = {
        socket: {
          host: socketConfig?.host || 'localhost',
          port: socketConfig?.port || 6379,
          keepAlive: socketConfig?.keepAlive ?? 5000,
          noDelay: true,
        },
        password: this.client.options?.password,
        username: this.client.options?.username,
        database: this.client.options?.database || 0,
      } as any
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
    const hashKey = this.makeGroupKey(groupId)
    await this.client.del(hashKey)
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

  async cleanup(): Promise<void> {
    this.subscriptions.clear()
  }
}
