import { InternalStateManager, StateOperation, BatchOperation, TransactionResult, BatchResult } from '../types'
import { RpcSender } from './rpc'

export class RpcStateManager implements InternalStateManager {
  constructor(private readonly sender: RpcSender) {}

  async get<T>(traceId: string, key: string) {
    return this.sender.send<T>('state.get', { traceId, key })
  }

  async set<T>(traceId: string, key: string, value: T) {
    return this.sender.send<T>('state.set', { traceId, key, value })
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    return this.sender.send<T>('state.delete', { traceId, key })
  }

  async clear(traceId: string) {
    await this.sender.send('state.clear', { traceId })
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    return this.sender.send<T[]>('state.getGroup', { groupId })
  }

  async update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    // For RPC, we need to pass the function as a string, but this loses closures
    // We'll pass the function string and let the server handle it
    return this.sender.send<T>('state.update', {
      traceId,
      key,
      updateFn: updateFn.toString(),
    })
  }

  // === NEW ATOMIC PRIMITIVES ===

  async increment(traceId: string, key: string, delta = 1): Promise<number> {
    return this.sender.send<number>('state.increment', { traceId, key, delta })
  }

  async decrement(traceId: string, key: string, delta = 1): Promise<number> {
    return this.sender.send<number>('state.decrement', { traceId, key, delta })
  }

  async compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean> {
    return this.sender.send<boolean>('state.compareAndSwap', { traceId, key, expected, newValue })
  }

  // === ATOMIC ARRAY OPERATIONS ===

  async push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    return this.sender.send<T[]>('state.push', { traceId, key, items })
  }

  async pop<T>(traceId: string, key: string): Promise<T | null> {
    return this.sender.send<T | null>('state.pop', { traceId, key })
  }

  async shift<T>(traceId: string, key: string): Promise<T | null> {
    return this.sender.send<T | null>('state.shift', { traceId, key })
  }

  async unshift<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    return this.sender.send<T[]>('state.unshift', { traceId, key, items })
  }

  // === ATOMIC OBJECT OPERATIONS ===

  async setField<T>(traceId: string, key: string, field: string, value: any): Promise<T> {
    return this.sender.send<T>('state.setField', { traceId, key, field, value })
  }

  async deleteField<T>(traceId: string, key: string, field: string): Promise<T> {
    return this.sender.send<T>('state.deleteField', { traceId, key, field })
  }

  // === TRANSACTION SUPPORT ===

  async transaction<T>(traceId: string, operations: StateOperation[]): Promise<TransactionResult<T>> {
    return this.sender.send<TransactionResult<T>>('state.transaction', { traceId, operations })
  }

  // === BATCH OPERATIONS ===

  async batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>> {
    return this.sender.send<BatchResult<T>>('state.batch', { traceId, operations })
  }

  // === UTILITY OPERATIONS ===

  async exists(traceId: string, key: string): Promise<boolean> {
    return this.sender.send<boolean>('state.exists', { traceId, key })
  }
}
