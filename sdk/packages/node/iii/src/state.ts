import type { UpdateOp } from './stream'

export type StateGetInput = {
  scope: string
  key: string
}

export type StateSetInput = {
  scope: string
  key: string
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here
  value: any
}

export type StateDeleteInput = {
  scope: string
  key: string
}

export type StateDeleteResult = {
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here
  old_value?: any
}

export type StateListInput = {
  scope: string
}

export type StateSetResult<TData> = {
  old_value?: TData
  new_value: TData
}

export type StateUpdateResult<TData> = {
  old_value?: TData
  new_value: TData
}

export type DeleteResult = {
  // biome-ignore lint/suspicious/noExplicitAny: any is fine here
  old_value?: any
}

export type StateUpdateInput = {
  scope: string
  key: string
  ops: UpdateOp[]
}

export enum StateEventType {
  Created = 'state:created',
  Updated = 'state:updated',
  Deleted = 'state:deleted',
}

// biome-ignore lint/suspicious/noExplicitAny: any is fine here
export interface StateEventData<TData = any> {
  type: 'state'
  event_type: StateEventType
  scope: string
  key: string
  old_value?: TData
  new_value?: TData
}

export interface IState {
  get<TData>(input: StateGetInput): Promise<TData | null>
  set<TData>(input: StateSetInput): Promise<StateSetResult<TData> | null>
  delete(input: StateDeleteInput): Promise<DeleteResult>
  list<TData>(input: StateListInput): Promise<TData[]>
  update<TData>(input: StateUpdateInput): Promise<StateUpdateResult<TData> | null>
}
