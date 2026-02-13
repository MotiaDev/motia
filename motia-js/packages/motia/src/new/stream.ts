import type { StreamSetResult, UpdateOp } from 'iii-sdk/stream'
import type { StreamConfig } from '../types-stream'
import { getInstance } from './iii'

export class Stream<TData> {
  constructor(readonly config: StreamConfig) {}

  async get(groupId: string, itemId: string): Promise<TData | null> {
    return getInstance().call('stream.get', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
    })
  }

  async set(groupId: string, itemId: string, data: TData): Promise<StreamSetResult<TData> | null> {
    return getInstance().call('stream.set', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
      data,
    })
  }

  async delete(groupId: string, itemId: string): Promise<void> {
    return getInstance().call('stream.delete', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
    })
  }

  async list(groupId: string): Promise<TData[]> {
    return getInstance().call('stream.list', {
      stream_name: this.config.name,
      group_id: groupId,
    })
  }

  async update(groupId: string, itemId: string, ops: UpdateOp[]): Promise<StreamSetResult<TData> | null> {
    return getInstance().call('stream.update', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
      ops,
    })
  }

  async listGroups(): Promise<string[]> {
    return getInstance().call('stream.list_groups', {
      stream_name: this.config.name,
    })
  }
}
