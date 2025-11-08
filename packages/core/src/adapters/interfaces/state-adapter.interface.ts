import type { InternalStateManager } from '../../types'

export interface StateItem {
  groupId: string
  key: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  value: string | number | boolean | object | unknown[] | null
}

export interface StateFilter {
  valueKey: string
  operation:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'isNotNull'
    | 'isNull'
  value: string
}

export interface StateItemsInput {
  groupId?: string
  filter?: StateFilter[]
}

export interface StateAdapter extends InternalStateManager {
  clear(traceId: string): Promise<void>
  cleanup(): Promise<void>

  keys(traceId: string): Promise<string[]>
  traceIds(): Promise<string[]>

  items(input: StateItemsInput): Promise<StateItem[]>
}
