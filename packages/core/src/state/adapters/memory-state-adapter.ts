import { StateAdapter, StateItem, StateItemsInput } from '../state-adapter'
import { filterItem, inferType } from './utils'

export class MemoryStateAdapter implements StateAdapter {
  private state: Record<string, unknown> = {}
  private lockQueues: Map<string, Array<() => void>> = new Map()
  private lockedKeys: Set<string> = new Set()

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
    
    // Always use locking for atomicity
    await this._acquireLock(fullKey)
    try {
      this.state[fullKey] = value
      return value
    } finally {
      this._releaseLock(fullKey)
    }
  }

  async update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    const fullKey = this._makeKey(traceId, key)
    
    // Wait for lock to be available
    await this._acquireLock(fullKey)
    
    try {
      const currentValue = this.state[fullKey] as T | null
      const newValue = updateFn(currentValue)
      this.state[fullKey] = newValue
      return newValue
    } finally {
      // Release the lock
      this._releaseLock(fullKey)
    }
  }

  async atomicUpdate<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    // Delegate to the new update method for consistency
    return this.update(traceId, key, updateFn)
  }

  private async _acquireLock(key: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.lockedKeys.has(key)) {
        // No lock exists, acquire it immediately
        this.lockedKeys.add(key)
        resolve()
        return
      }
      
      // Lock exists, add to queue
      if (!this.lockQueues.has(key)) {
        this.lockQueues.set(key, [])
      }
      this.lockQueues.get(key)!.push(resolve)
    })
  }

  private _releaseLock(key: string): void {
    this.lockedKeys.delete(key)
    
    const queue = this.lockQueues.get(key)
    if (queue && queue.length > 0) {
      const nextResolver = queue.shift()!
      this.lockedKeys.add(key)
      nextResolver()
    } else {
      this.lockQueues.delete(key)
    }
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
      .map(([key, value]) => ({
        groupId: key.split(':')[0],
        key: key.split(':')[1],
        type: inferType(value),
        value: value as StateItem['value'],
      }))
      .filter((item) => (input.groupId ? item.groupId === input.groupId : true))
      .filter((item) => (input.filter ? filterItem(item, input.filter) : true))
  }

  async cleanup() {
    // No cleanup needed for memory
  }

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }
}
