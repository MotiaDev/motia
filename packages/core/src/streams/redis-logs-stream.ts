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
const FLUSH_INTERVAL_MS = 500

export class RedisLogsStream extends StreamAdapter<Log> {
  private client: RedisClientType
  readonly keyPrefix = 'motia:logs:'
  private memoryLogs: Map<string, Map<string, BaseStreamItem<Log>>> = new Map()
  private pendingFlush: Map<string, BaseStreamItem<Log>> = new Map()
  private flushTimer: ReturnType<typeof setInterval> | null = null

  constructor(client: RedisClientType) {
    super('__motia.logs')
    this.client = client
    this.startFlushInterval()
  }

  private startFlushInterval(): void {
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
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

  private async flush(): Promise<void> {
    if (this.pendingFlush.size === 0) return

    const logsToFlush = new Map(this.pendingFlush)
    this.pendingFlush.clear()

    try {
      const multi = this.client.multi()

      for (const [key, item] of logsToFlush) {
        multi.set(key, JSON.stringify(item))
        multi.expire(key, LOG_TTL_SECONDS)
      }

      await multi.exec()
    } catch {
      for (const [key, item] of logsToFlush) {
        this.pendingFlush.set(key, item)
      }
    }
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
    const groupLogs = this.memoryLogs.get(groupId)
    const memoryItem = groupLogs?.get(id)
    if (memoryItem) {
      return memoryItem
    }

    const key = this.makeLogKey(groupId, id)
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  async set(groupId: string, id: string, data: Log): Promise<BaseStreamItem<Log>> {
    const logId = id || this.makeLogId()
    const logData: Log = { ...data, id: logId }
    const item: BaseStreamItem<Log> = { ...logData, id: logId }

    let groupLogs = this.memoryLogs.get(groupId)
    if (!groupLogs) {
      groupLogs = new Map()
      this.memoryLogs.set(groupId, groupLogs)
    }
    groupLogs.set(logId, item)

    const key = this.makeLogKey(groupId, logId)
    this.pendingFlush.set(key, item)

    this.send({ groupId, id: logId }, { type: 'log', data: item })

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
    const memoryGroupLogs = this.memoryLogs.get(groupId)
    const memoryItems = memoryGroupLogs ? Array.from(memoryGroupLogs.values()) : []

    const pattern = `${this.keyPrefix}${groupId}:*`
    const keys = await this.scanKeys(pattern)

    let redisItems: BaseStreamItem<Log>[] = []
    if (keys.length > 0) {
      const values = await this.client.mGet(keys)
      redisItems = values.filter((v): v is string => v !== null).map((v) => JSON.parse(v) as BaseStreamItem<Log>)
    }

    const allLogs = new Map<string, BaseStreamItem<Log>>()
    for (const item of redisItems) {
      allLogs.set(item.id, item)
    }
    for (const item of memoryItems) {
      allLogs.set(item.id, item)
    }

    return Array.from(allLogs.values()).sort((a, b) => a.time - b.time)
  }

  async send<T>(channel: { groupId: string; id: string }, event: StateStreamEvent<T>): Promise<void> {
    const channelKey = this.makeChannelKey(channel)
    await this.client.publish(channelKey, JSON.stringify(event))
  }

  async clear(groupId: string): Promise<void> {
    this.memoryLogs.delete(groupId)

    for (const key of this.pendingFlush.keys()) {
      if (key.startsWith(`${this.keyPrefix}${groupId}:`)) {
        this.pendingFlush.delete(key)
      }
    }

    const pattern = `${this.keyPrefix}${groupId}:*`
    const keys = await this.scanKeys(pattern)

    if (keys.length === 0) return

    await this.client.del(keys)
  }

  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush()
  }
}
