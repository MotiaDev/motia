import type { StreamSetResult, UpdateOp } from '@iii-dev/sdk'
import type { InternalStateManager } from '../types'
import { bridge } from './bridge'

export class StateManager implements InternalStateManager {
  async get<T>(groupId: string, itemId: string): Promise<T | null> {
    return bridge.invokeFunction('state.get', { group_id: groupId, item_id: itemId })
  }

  async set<T>(groupId: string, itemId: string, data: T): Promise<StreamSetResult<T> | null> {
    return bridge.invokeFunction('state.set', {
      group_id: groupId,
      item_id: itemId,
      data,
    }) as Promise<StreamSetResult<T> | null>
  }

  async delete<T>(groupId: string, itemId: string): Promise<T | null> {
    return bridge.invokeFunction('state.delete', { group_id: groupId, item_id: itemId })
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    return bridge.invokeFunction('state.getGroup', { group_id: groupId })
  }

  async listGroups(): Promise<string[]> {
    return bridge.invokeFunction('state.listGroups', {})
  }

  async update<T>(groupId: string, itemId: string, ops: UpdateOp[]): Promise<StreamSetResult<T> | null> {
    return bridge.invokeFunction('state.update', { group_id: groupId, item_id: itemId, ops })
  }

  async clear(groupId: string): Promise<void> {
    const items = await this.getGroup<{ id: string }>(groupId)

    for (const item of items) {
      await this.delete(groupId, item.id)
    }
  }
}
