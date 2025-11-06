import type { StateAdapter, StateItem, StateItemsInput } from '../../interfaces/state-adapter.interface'
import { filterItem, inferType } from './utils'

export class MemoryStateAdapter implements StateAdapter {
  private state: Record<string, unknown> = {}

  constructor() {
    this.state = {}
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    return Object.entries(this.state)
      .filter(([key]) => key.startsWith(groupId))
      .map(([, value]) => value as T)
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this._makeKey(traceId, key)

    return this.state[fullKey] ? (this.state[fullKey] as T) : null
  }

  async set<T>(traceId: string, key: string, value: T) {
    const fullKey = this._makeKey(traceId, key)

    this.state[fullKey] = value

    return value
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this._makeKey(traceId, key)
    const value = await this.get<T>(traceId, key)

    if (value) {
      delete this.state[fullKey]
    }

    return value
  }

  async clear(traceId: string) {
    const pattern = this._makeKey(traceId, '')

    for (const key in this.state) {
      if (key.startsWith(pattern)) {
        delete this.state[key]
      }
    }
  }

  async keys(traceId: string) {
    return Object.keys(this.state)
      .filter((key) => key.startsWith(this._makeKey(traceId, '')))
      .map((key) => key.replace(this._makeKey(traceId, ''), ''))
  }

  async traceIds() {
    const traceIds = new Set<string>()

    Object.keys(this.state).forEach((key) => traceIds.add(key.split(':')[0]))

    return Array.from(traceIds)
  }

  async items(input: StateItemsInput): Promise<StateItem[]> {
    return Object.entries(this.state)
      .map(([key, value]) => {
        const [groupId, ...keyParts] = key.split(':')
        return {
          groupId,
          key: keyParts.join(':'),
          type: inferType(value),
          value: value as StateItem['value'],
        }
      })
      .filter((item) => (input.groupId ? item.groupId === input.groupId : true))
      .filter((item) => (input.filter ? filterItem(item, input.filter) : true))
  }

  async cleanup() {}

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }
}
