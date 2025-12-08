import type { RedisClientType } from 'redis'
import { v4 as uuidv4 } from 'uuid'
import { StreamAdapter } from '../adapters/interfaces/stream-adapter.interface'
import type { BaseStreamItem, StateStreamEvent } from '../types-stream'

export type Log = {
  id: string
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any
}

const LOG_TTL_SECONDS = 3 * 24 * 60 * 60

export class RedisLogsStream extends StreamAdapter<Log> {
  private client: RedisClientType
  readonly keyPrefix = 'motia:logs:'

  constructor(client: RedisClientType) {
    super('__motia.logs')
    this.client = client
  }

  private makeLogKey(groupId: string, id: string): string {
    return `${this.keyPrefix}${groupId}:${id}`
  }

  private makeChannelKey(channel: { groupId: string; id: string }): string {
    return `${this.keyPrefix}events:${channel.groupId}:${channel.id}`
  }

  private makeLogId(): string {
    return `${Date.now()}-${uuidv4()}`
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = []
    let cursor: string | number = '0'

    do {
      const result = await this.client.scan(cursor.toString(), {
        MATCH: pattern,
        COUNT: 100,
      })
      cursor = result.cursor
      keys.push(...result.keys)
    } while (String(cursor) !== '0')

    return keys
  }

  async get(groupId: string, id: string): Promise<BaseStreamItem<Log> | null> {
    const key = this.makeLogKey(groupId, id)
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  async set(groupId: string, id: string, data: Log): Promise<BaseStreamItem<Log>> {
    const logId = id || this.makeLogId()
    const key = this.makeLogKey(groupId, logId)
    const logData: Log = { ...data, id: logId }
    const item: BaseStreamItem<Log> = { ...logData, id: logId }
    const itemJson = JSON.stringify(item)

    await Promise.all([
      this.client.set(key, itemJson),
      this.client.expire(key, LOG_TTL_SECONDS),
      this.send({ groupId, id: logId }, { type: 'log', data: item }),
    ])

    return item
  }

  async delete(groupId: string, id: string): Promise<BaseStreamItem<Log> | null> {
    const key = this.makeLogKey(groupId, id)
    const value = await this.client.get(key)

    if (!value) return null

    const item = JSON.parse(value) as BaseStreamItem<Log>

    await Promise.all([this.client.del(key), this.send({ groupId, id }, { type: 'delete', data: item })])

    return item
  }

  async getGroup(groupId: string): Promise<BaseStreamItem<Log>[]> {
    const pattern = `${this.keyPrefix}${groupId}:*`
    const keys = await this.scanKeys(pattern)

    if (keys.length === 0) return []

    const values = await this.client.mGet(keys)
    const logs = values.filter((v): v is string => v !== null).map((v) => JSON.parse(v) as BaseStreamItem<Log>)

    const sortDesc = (a: BaseStreamItem<Log>, b: BaseStreamItem<Log>) => a.time - b.time
    return logs.sort(sortDesc)
  }

  async send<T>(channel: { groupId: string; id: string }, event: StateStreamEvent<T>): Promise<void> {
    const channelKey = this.makeChannelKey(channel)
    await this.client.publish(channelKey, JSON.stringify(event))
  }

  async clear(groupId: string): Promise<void> {
    const pattern = `${this.keyPrefix}${groupId}:*`
    const keys = await this.scanKeys(pattern)

    if (keys.length === 0) return

    await this.client.del(keys)
  }
}
