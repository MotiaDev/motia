import type { BaseStreamItem, MotiaStream, StateStreamEvent, StateStreamEventChannel } from '../../types-stream'

export interface StreamQueryFilter<TData> {
  limit?: number
  offset?: number
  orderBy?: keyof TData
  orderDirection?: 'asc' | 'desc'
  where?: Partial<TData>
}

export abstract class StreamAdapter<TData> implements MotiaStream<TData> {
  protected streamName: string

  constructor(streamName: string) {
    this.streamName = streamName
  }

  abstract get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  abstract set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>>
  abstract delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  abstract getGroup(groupId: string): Promise<BaseStreamItem<TData>[]>

  async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void> {}

  async subscribe<T>(
    channel: StateStreamEventChannel,
    handler: (event: StateStreamEvent<T>) => void | Promise<void>,
  ): Promise<void> {}

  async unsubscribe(channel: StateStreamEventChannel): Promise<void> {}

  async clear(groupId: string): Promise<void> {}

  async query(groupId: string, filter: StreamQueryFilter<TData>): Promise<BaseStreamItem<TData>[]> {
    return []
  }
}
