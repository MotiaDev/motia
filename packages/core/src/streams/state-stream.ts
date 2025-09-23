import { StateItem } from '../state/state-adapter'
import { StreamAdapter } from './adapters/stream-adapter'
import { StateStreamEvent, StateStreamEventChannel, BaseStreamItem } from '../types-stream'
import { InternalStateManager } from '../types'

export interface StateStreamItem extends BaseStreamItem {
  groupId: string
  key: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  value: string | number | boolean | object | unknown[] | null
  timestamp: number
  operation: 'set' | 'delete' | 'clear'
  traceId?: string
}

export class StateStreamAdapter extends StreamAdapter<StateStreamItem> {
  constructor(private readonly stateAdapter: InternalStateManager) {
    super()
  }

  async get(groupId: string, id: string): Promise<BaseStreamItem<StateStreamItem> | null> {
    // Parse the id to get groupId and key
    const [itemGroupId, key] = id.split(':')
    if (itemGroupId !== groupId) {
      return null
    }

    try {
      const value = await this.stateAdapter.get(itemGroupId, key)
      if (value === null || value === undefined) {
        return null
      }

      return {
        id,
        groupId: itemGroupId,
        key,
        type: this.inferType(value),
        value,
        timestamp: Date.now(),
        operation: 'set',
      }
    } catch {
      return null
    }
  }

  async set(groupId: string, id: string, data: StateStreamItem): Promise<BaseStreamItem<StateStreamItem>> {
    // Emit WebSocket event for state change - copy the logs pattern exactly
    await this.send({ groupId: 'default' }, { type: 'state-change', data })
    return { ...data, id }
  }

  async delete(groupId: string, id: string): Promise<BaseStreamItem<StateStreamItem> | null> {
    // Parse the id to get groupId and key
    const [itemGroupId, key] = id.split(':')
    if (itemGroupId !== groupId) {
      return null
    }

    try {
      const value = await this.stateAdapter.get(itemGroupId, key)
      if (value === null || value === undefined) {
        return null
      }

      const deletedItem: StateStreamItem = {
        id,
        groupId: itemGroupId,
        key,
        type: this.inferType(value),
        value,
        timestamp: Date.now(),
        operation: 'delete',
      }

      return deletedItem
    } catch {
      return null
    }
  }

  async getGroup(groupId: string): Promise<BaseStreamItem<StateStreamItem>[]> {
    try {
      // For InternalStateManager, we can't get all items directly
      // This is a limitation - we'll return empty array for now
      // In a real implementation, we'd need to track state items separately
      return []
    } catch {
      return []
    }
  }

  async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void> {
    // Emit state change events
    if (event.type === 'state-change') {
      const stateEvent = event as StateStreamEvent<StateStreamItem>
      const id = `${stateEvent.data.groupId}:${stateEvent.data.key}`
      
      if (stateEvent.data.operation === 'delete') {
        await this.delete(stateEvent.data.groupId, id)
      } else {
        await this.set(stateEvent.data.groupId, id, stateEvent.data)
      }
    }
  }

  // Helper method to emit state change events
  async emitStateChange(item: StateStreamItem, traceId?: string): Promise<void> {
    // Use the set method to trigger the WebSocket event
    await this.set(item.groupId, item.id, item)
  }

  private inferType(value: unknown): StateStreamItem['type'] {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'object'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'null'
  }
}
