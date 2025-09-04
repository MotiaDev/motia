import type { BaseStreamItem, MotiaStream, StateStreamEvent, StateStreamEventChannel } from '../../types-stream'

/**
 * Interface for stream management adapters
 */
export abstract class StreamAdapter<TData> implements MotiaStream<TData> {
  abstract get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  abstract set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>>
  abstract delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  abstract getGroup(groupId: string): Promise<BaseStreamItem<TData>[]>

  // biome-ignore lint/correctness/noUnusedVariables: migration
  async send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void> {}
}
