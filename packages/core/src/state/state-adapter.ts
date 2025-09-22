import { InternalStateManager, StateOperation, BatchOperation, TransactionResult, BatchResult } from '../types'

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

/**
 * Interface for state management adapters
 * All operations are atomic by default
 */
export interface StateAdapter extends InternalStateManager {
  // Core operations (inherited from InternalStateManager)
  clear(traceId: string): Promise<void>
  cleanup(): Promise<void>

  keys(traceId: string): Promise<string[]>
  traceIds(): Promise<string[]>

  items(input: StateItemsInput): Promise<StateItem[]>
  
  // Atomic operations (inherited from InternalStateManager)
  update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T>
  
  // New atomic primitives (inherited from InternalStateManager)
  increment(traceId: string, key: string, delta?: number): Promise<number>
  decrement(traceId: string, key: string, delta?: number): Promise<number>
  compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean>
  
  // Atomic array operations (inherited from InternalStateManager)
  push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]>
  pop<T>(traceId: string, key: string): Promise<T | null>
  shift<T>(traceId: string, key: string): Promise<T | null>
  unshift<T>(traceId: string, key: string, ...items: T[]): Promise<T[]>
  
  // Atomic object operations (inherited from InternalStateManager)
  setField<T>(traceId: string, key: string, field: string, value: any): Promise<T>
  deleteField<T>(traceId: string, key: string, field: string): Promise<T>
  
  // Transaction support (inherited from InternalStateManager)
  transaction<T>(traceId: string, operations: StateOperation[]): Promise<TransactionResult<T>>
  
  // Batch operations (inherited from InternalStateManager)
  batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>>
  
  // Utility operations (inherited from InternalStateManager)
  exists(traceId: string, key: string): Promise<boolean>
  
}
