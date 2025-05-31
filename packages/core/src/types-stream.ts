import { ZodObject } from 'zod'
import { StateStreamFactory } from './state-stream'

export interface StateStreamConfig {
  name: string
  schema: ZodObject<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  baseConfig:
    | { storageType: 'state' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | { storageType: 'custom'; factory: () => IStateStream<any> }
}

export type StateStreamEventChannel = { groupId: string; id?: string }
export type StateStreamEvent<TData> = { type: string; data: TData }

export type BaseStreamItem<TData = unknown> = TData & { id: string }

export type Stream<TConfig extends StateStreamConfig = StateStreamConfig> = {
  filePath: string
  config: TConfig
  hidden?: boolean
  factory: StateStreamFactory<unknown>
}

export interface IStateStream<TData> {
  get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData> | null>
  delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null>
  getGroup(groupId: string): Promise<BaseStreamItem<TData>[]>

  send<T>(channel: StateStreamEventChannel, event: StateStreamEvent<T>): Promise<void>
}
