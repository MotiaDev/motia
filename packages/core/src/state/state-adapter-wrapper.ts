import { StateItem } from './state-adapter'
import { StateStreamAdapter } from '../streams/state-stream'
import { InternalStateManager } from '../types'

export class StateAdapterWrapper implements InternalStateManager {
  constructor(
    private readonly stateAdapter: InternalStateManager,
    private readonly stateStream: StateStreamAdapter,
  ) {}

  async get<T>(traceId: string, key: string): Promise<T | null> {
    return this.stateAdapter.get<T>(traceId, key)
  }

  async set<T>(traceId: string, key: string, value: T): Promise<T> {
    await this.stateAdapter.set(traceId, key, value)
    
    // Emit state change event
    const stateItem: StateItem = {
      groupId: traceId,
      key,
      type: this.inferType(value),
      value: value as never,
    }

    const streamItem = {
      id: `${traceId}:${key}`,
      ...stateItem,
      timestamp: Date.now(),
      operation: 'set' as const,
      traceId,
    }

    await this.stateStream.emitStateChange(streamItem, traceId)
    
    return value
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const value = await this.stateAdapter.delete<T>(traceId, key)
    
    if (value !== null && value !== undefined) {
      // Emit state change event for deletion
      const stateItem: StateItem = {
        groupId: traceId,
        key,
        type: this.inferType(value),
        value: value as never,
      }

      const streamItem = {
        id: `${traceId}:${key}`,
        ...stateItem,
        timestamp: Date.now(),
        operation: 'delete' as const,
        traceId,
      }

      await this.stateStream.emitStateChange(streamItem, traceId)
    }

    return value
  }

  async clear(traceId: string): Promise<void> {
    // For InternalStateManager, we can't get all items before clearing
    // This is a limitation - we'll just clear without emitting individual delete events
    await this.stateAdapter.clear(traceId)
    
    // Emit a general clear event
    const streamItem = {
      id: `${traceId}:*`,
      groupId: traceId,
      key: '*',
      type: 'null' as const,
      value: null,
      timestamp: Date.now(),
      operation: 'clear' as const,
      traceId,
    }

    await this.stateStream.emitStateChange(streamItem, traceId)
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    return this.stateAdapter.getGroup<T>(groupId)
  }

  private inferType(value: unknown): StateItem['type'] {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'object'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'null'
  }
}
