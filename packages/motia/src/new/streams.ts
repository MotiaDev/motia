import type { StreamSetResult, UpdateOp } from '@iii-dev/sdk/streams'
import type { StreamConfig } from '../types-stream'
import { iii } from './iii'

export class Stream<TData> {
  constructor(readonly config: StreamConfig) {}

  async get(groupId: string, itemId: string): Promise<TData | null> {
    return iii.call('streams.get', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
    })
  }

  async set(groupId: string, itemId: string, data: TData): Promise<StreamSetResult<TData> | null> {
    return iii.call('streams.set', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
      data,
    })
  }

  async delete(groupId: string, itemId: string): Promise<void> {
    return iii.call('streams.delete', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
    })
  }

  async list(groupId: string): Promise<TData[]> {
    return iii.call('streams.list', {
      stream_name: this.config.name,
      group_id: groupId,
    })
  }

  async update(groupId: string, itemId: string, ops: UpdateOp[]): Promise<StreamSetResult<TData> | null> {
    return iii.call('streams.update', {
      stream_name: this.config.name,
      group_id: groupId,
      item_id: itemId,
      ops,
    })
  }

  async listGroups(): Promise<string[]> {
    return iii.call('streams.list_groups', {
      stream_name: this.config.name,
    })
  }
}
