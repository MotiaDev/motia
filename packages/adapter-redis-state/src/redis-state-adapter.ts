import type { StateAdapter, StateFilter, StateItem, StateItemsInput } from '@motiadev/core'
import { createClient, type RedisClientType } from 'redis'
import type { RedisStateAdapterConfig } from './types'

export class RedisStateAdapter implements StateAdapter {
  private client: RedisClientType
  private keyPrefix: string
  private ttl?: number
  private connected = false

  constructor(config: RedisStateAdapterConfig) {
    this.keyPrefix = config.keyPrefix || 'motia:state:'
    this.ttl = config.ttl

    this.client = createClient({
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
    })

    this.client.on('error', (err) => {
      console.error('[Redis State] Client error:', err)
    })

    this.client.on('connect', () => {
      this.connected = true
    })

    this.client.on('disconnect', () => {
      console.warn('[Redis State] Disconnected')
      this.connected = false
    })

    this.client.on('reconnecting', () => {
      console.log('[Redis State] Reconnecting...')
    })

    this.connect()
  }

  private async connect(): Promise<void> {
    if (!this.connected && !this.client.isOpen) {
      try {
        await this.client.connect()
      } catch (error) {
        console.error('[Redis State] Failed to connect:', error)
        throw error
      }
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.connect()
    }
  }

  private makeKey(traceId: string, key: string): string {
    return `${this.keyPrefix}${traceId}:${key}`
  }

  private makeTracePrefix(traceId: string): string {
    return `${this.keyPrefix}${traceId}:`
  }

  private extractKey(fullKey: string, traceId: string): string {
    const prefix = this.makeTracePrefix(traceId)
    return fullKey.slice(prefix.length)
  }

  private determineType(value: unknown): StateItem['type'] {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return (
      (['string', 'number', 'boolean', 'object'].find((type) => typeof value === type) as StateItem['type']) || 'object'
    )
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    await this.ensureConnected()
    const fullKey = this.makeKey(traceId, key)
    const value = await this.client.get(fullKey)
    return value ? JSON.parse(value) : null
  }

  async set<T>(traceId: string, key: string, value: T): Promise<T> {
    await this.ensureConnected()
    const fullKey = this.makeKey(traceId, key)
    const serialized = JSON.stringify(value)

    if (this.ttl) {
      await this.client.setEx(fullKey, this.ttl, serialized)
    } else {
      await this.client.set(fullKey, serialized)
    }

    return value
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    await this.ensureConnected()
    const fullKey = this.makeKey(traceId, key)
    const value = await this.get<T>(traceId, key)
    await this.client.del(fullKey)
    return value
  }

  async getGroup<T>(traceId: string): Promise<T[]> {
    await this.ensureConnected()
    const pattern = `${this.makeTracePrefix(traceId)}*`
    const keys = await this.scanKeys(pattern)

    if (keys.length === 0) return []

    const values = await this.client.mGet(keys)
    return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v))
  }

  async clear(traceId: string): Promise<void> {
    await this.ensureConnected()
    const pattern = `${this.makeTracePrefix(traceId)}*`
    const keys = await this.scanKeys(pattern)

    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }

  async cleanup(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit()
    }
  }

  async keys(traceId: string): Promise<string[]> {
    await this.ensureConnected()
    const pattern = `${this.makeTracePrefix(traceId)}*`
    const keys = await this.scanKeys(pattern)
    return keys.map((key) => this.extractKey(key, traceId))
  }

  async traceIds(): Promise<string[]> {
    await this.ensureConnected()
    const pattern = `${this.keyPrefix}*`
    const keys = await this.scanKeys(pattern)

    const traceIdSet = new Set<string>()
    for (const key of keys) {
      const withoutPrefix = key.slice(this.keyPrefix.length)
      const traceId = withoutPrefix.split(':')[0]
      if (traceId) {
        traceIdSet.add(traceId)
      }
    }

    return Array.from(traceIdSet)
  }

  async items(input: StateItemsInput): Promise<StateItem[]> {
    await this.ensureConnected()
    const items: StateItem[] = []

    if (input.groupId) {
      const pattern = `${this.makeTracePrefix(input.groupId)}*`
      const keys = await this.scanKeys(pattern)

      for (const fullKey of keys) {
        const value = await this.client.get(fullKey)
        if (value !== null) {
          const key = this.extractKey(fullKey, input.groupId)
          const parsedValue = JSON.parse(value)
          items.push({
            groupId: input.groupId,
            key,
            type: this.determineType(parsedValue),
            value: parsedValue,
          })
        }
      }
    } else {
      const traceIds = await this.traceIds()
      for (const traceId of traceIds) {
        const pattern = `${this.makeTracePrefix(traceId)}*`
        const keys = await this.scanKeys(pattern)

        for (const fullKey of keys) {
          const value = await this.client.get(fullKey)
          if (value !== null) {
            const key = this.extractKey(fullKey, traceId)
            const parsedValue = JSON.parse(value)
            items.push({
              groupId: traceId,
              key,
              type: this.determineType(parsedValue),
              value: parsedValue,
            })
          }
        }
      }
    }

    if (input.filter && input.filter.length > 0) {
      return this.applyFilters(items, input.filter)
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

  private applyFilters(items: StateItem[], filters: StateFilter[]): StateItem[] {
    return items.filter((item) => {
      return filters.every((filter) => this.matchesFilter(item, filter))
    })
  }

  private matchesFilter(item: StateItem, filter: StateFilter): boolean {
    const value =
      typeof item.value === 'object' && item.value !== null ? (item.value as any)[filter.valueKey] : item.value

    const filterValue = filter.value

    switch (filter.operation) {
      case 'eq':
        return value === filterValue
      case 'neq':
        return value !== filterValue
      case 'gt':
        return value > filterValue
      case 'gte':
        return value >= filterValue
      case 'lt':
        return value < filterValue
      case 'lte':
        return value <= filterValue
      case 'contains':
        return typeof value === 'string' && value.includes(filterValue)
      case 'notContains':
        return typeof value === 'string' && !value.includes(filterValue)
      case 'startsWith':
        return typeof value === 'string' && value.startsWith(filterValue)
      case 'endsWith':
        return typeof value === 'string' && value.endsWith(filterValue)
      case 'isNotNull':
        return value !== null && value !== undefined
      case 'isNull':
        return value === null || value === undefined
      default:
        return false
    }
  }
}
