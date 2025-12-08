import type { RedisClientType } from 'redis'
import { StreamAdapter } from '../adapters/interfaces/stream-adapter.interface'
import type { BaseStreamItem, StateStreamEvent, StateStreamEventChannel } from '../types-stream'

const TRACE_TTL_SECONDS = 3 * 24 * 60 * 60

export class RedisTraceStreamAdapter<TData> extends StreamAdapter<TData> {
  private client: RedisClientType
  private readonly keyPrefix: string = 'motia:trace:'
  private ttl: number

  constructor(streamName: string, client: RedisClientType, ttl: number = TRACE_TTL_SECONDS) {
    super(streamName)
    this.client = client
    this.ttl = ttl
  }

  private makeGroupKey(groupId: string): string {
    return `${this.keyPrefix}${groupId}`
  }

  async get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const hashKey = this.makeGroupKey(groupId)
    const value = await this.client.hGet(hashKey, id)
    return value ? JSON.parse(value) : null
  }

  async set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>> {
    const hashKey = this.makeGroupKey(groupId)
    const item: BaseStreamItem<TData> = { ...data, id } as BaseStreamItem<TData>
    const itemJson = JSON.stringify(item)

    const existed = await this.client.hExists(hashKey, id)
    const eventType = existed ? 'update' : 'create'

    await Promise.all([
      this.client.hSet(hashKey, id, itemJson),
      this.send({ groupId, id }, { type: eventType, data: item }),
      this.client.expire(hashKey, this.ttl),
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

    const items = Object.values(values).map((v: string) => JSON.parse(v) as BaseStreamItem<TData>)

    const sortDesc = (a: BaseStreamItem<TData>, b: BaseStreamItem<TData>) => {
      const aTime = (a as { startTime?: number }).startTime || 0
      const bTime = (b as { startTime?: number }).startTime || 0
      return aTime - bTime
    }
    return items.sort(sortDesc)
  }

  async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void> {
    const channelKey = channel.id
      ? `${this.keyPrefix}events:${this.streamName}:${channel.groupId}:${channel.id}`
      : `${this.keyPrefix}events:${this.streamName}:${channel.groupId}`
    await this.client.publish(channelKey, JSON.stringify(event))
  }

  async clear(groupId: string): Promise<void> {
    const hashKey = this.makeGroupKey(groupId)
    await this.client.del(hashKey)
  }
}
