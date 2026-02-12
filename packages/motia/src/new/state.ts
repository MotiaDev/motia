import type { StreamSetResult, UpdateOp } from '@iii-dev/sdk/stream'
import type { InternalStateManager } from '../types'
import { iii } from './iii'

export class StateManager implements InternalStateManager {
  async get<T>(groupId: string, itemId: string): Promise<T | null> {
    return iii.call('state.get', { group_id: groupId, item_id: itemId })
  }

  async set<T>(groupId: string, itemId: string, data: T): Promise<StreamSetResult<T> | null> {
    return iii.call('state.set', {
      group_id: groupId,
      item_id: itemId,
      data,
    }) as Promise<StreamSetResult<T> | null>
  }

  async delete<T>(groupId: string, itemId: string): Promise<T | null> {
    return iii.call('state.delete', { group_id: groupId, item_id: itemId })
  }

  async list<T>(groupId: string): Promise<T[]> {
    return iii.call('state.list', { group_id: groupId })
  }

  async listGroups(): Promise<string[]> {
    return iii.call('state.listGroups', {})
  }

  async update<T>(groupId: string, itemId: string, ops: UpdateOp[]): Promise<StreamSetResult<T> | null> {
    return iii.call('state.update', { group_id: groupId, item_id: itemId, ops })
  }

  async clear(groupId: string): Promise<void> {
    const items = await this.list<{ id: string }>(groupId)

    for (const item of items) {
      await this.delete(groupId, item.id)
    }
  }
}
