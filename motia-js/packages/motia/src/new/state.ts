import type { StreamSetResult, UpdateOp } from 'iii-sdk/stream'
import type { InternalStateManager } from '../types'
import { getInstance } from './iii'

export class StateManager implements InternalStateManager {
  async get<T>(scope: string, key: string): Promise<T | null> {
    return getInstance().call('state::get', { scope, key })
  }

  async set<T>(scope: string, key: string, data: T): Promise<StreamSetResult<T> | null> {
    return getInstance().call('state::set', {
      scope,
      key,
      data,
    }) as Promise<StreamSetResult<T> | null>
  }

  async delete<T>(scope: string, key: string): Promise<T | null> {
    return getInstance().call('state::delete', { scope, key })
  }

  async list<T>(scope: string): Promise<T[]> {
    return getInstance().call('state::list', { scope })
  }

  async listGroups(): Promise<string[]> {
    return getInstance().call('state::list_groups', {})
  }

  async update<T>(scope: string, key: string, ops: UpdateOp[]): Promise<StreamSetResult<T> | null> {
    return getInstance().call('state::update', { scope, key, ops })
  }

  async clear(scope: string): Promise<void> {
    const items = await this.list<{ id: string }>(scope)

    for (const item of items) {
      await this.delete(scope, item.id)
    }
  }
}

export const stateManager = new StateManager()
