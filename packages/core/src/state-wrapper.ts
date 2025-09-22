import { InternalStateManager, StateOperation, BatchOperation, TransactionResult, BatchResult } from './types'

export type StateChangeCallback = (traceId: string, key: string, value: any, depth?: number) => Promise<void>

// Helper to identify mutating operations that should trigger state change callbacks
const MUTATING_OPS = new Set(['set', 'update', 'delete', 'increment', 'decrement', 'compareAndSwap', 'push', 'pop', 'shift', 'unshift', 'setField', 'deleteField'])

export class StateWrapper implements InternalStateManager {
  private stateChangeCallback?: StateChangeCallback

  constructor(private readonly stateManager: InternalStateManager) {}

  setStateChangeCallback(callback: StateChangeCallback) {
    this.stateChangeCallback = callback
  }

  private async notify(traceId: string, key: string, value: any, depth = 0) {
    if (!this.stateChangeCallback) return
    try {
      await this.stateChangeCallback(traceId, key, value, depth + 1)
    } catch (error) {
      console.error('[StateWrapper] State change callback failed:', error)
    }
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    return this.stateManager.get<T>(traceId, key)
  }

  async set<T>(traceId: string, key: string, value: T): Promise<T> {
    const result = await this.stateManager.set<T>(traceId, key, value)
    
    // Notify state change callback if set
    await this.notify(traceId, key, value)
    
    return result
  }

  async update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    const result = await this.stateManager.update<T>(traceId, key, updateFn)
    
    // Notify state change callback if set
    await this.notify(traceId, key, result)
    
    return result
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const result = await this.stateManager.delete<T>(traceId, key)
    
    // Notify state change callback if set
    await this.notify(traceId, key, null) // null indicates deletion
    
    return result
  }

  async clear(traceId: string): Promise<void> {
    await this.stateManager.clear(traceId)
    
    // Note: We don't call the callback for clear operations as it would be too noisy
    // Individual delete operations will trigger their own callbacks
  }


  async getGroup<T>(groupId: string): Promise<T[]> {
    return this.stateManager.getGroup<T>(groupId)
  }

  // === NEW ATOMIC PRIMITIVES ===

  async increment(traceId: string, key: string, delta = 1): Promise<number> {
    const result = await this.stateManager.increment(traceId, key, delta)
    
    // Notify state change callback if set
    await this.notify(traceId, key, result)
    
    return result
  }

  async decrement(traceId: string, key: string, delta = 1): Promise<number> {
    const result = await this.stateManager.decrement(traceId, key, delta)
    
    // Notify state change callback if set
    await this.notify(traceId, key, result)
    
    return result
  }

  async compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean> {
    const result = await this.stateManager.compareAndSwap<T>(traceId, key, expected, newValue)
    
    // Only notify callback if the swap was successful
    if (result) {
      await this.notify(traceId, key, newValue)
    }
    
    return result
  }

  // === ATOMIC ARRAY OPERATIONS ===

  async push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    const result = await this.stateManager.push<T>(traceId, key, ...items)
    
    // Notify state change callback if set
    await this.notify(traceId, key, result)
    
    return result
  }

  async pop<T>(traceId: string, key: string): Promise<T | null> {
    const result = await this.stateManager.pop<T>(traceId, key)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      // Get the current state after pop to notify callback
      const currentState = await this.stateManager.get<T[]>(traceId, key)
      await this.notify(traceId, key, currentState)
    }
    
    return result
  }

  async shift<T>(traceId: string, key: string): Promise<T | null> {
    const result = await this.stateManager.shift<T>(traceId, key)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      // Get the current state after shift to notify callback
      const currentState = await this.stateManager.get<T[]>(traceId, key)
      await this.notify(traceId, key, currentState)
    }
    
    return result
  }

  async unshift<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    const result = await this.stateManager.unshift<T>(traceId, key, ...items)
    
    // Notify state change callback if set
    await this.notify(traceId, key, result)
    
    return result
  }

  // === ATOMIC OBJECT OPERATIONS ===

  async setField<T>(traceId: string, key: string, field: string, value: any): Promise<T> {
    const result = await this.stateManager.setField<T>(traceId, key, field, value)
    
    // Notify state change callback if set
    await this.notify(traceId, key, result)
    
    return result
  }

  async deleteField<T>(traceId: string, key: string, field: string): Promise<T> {
    const result = await this.stateManager.deleteField<T>(traceId, key, field)
    
    // Notify state change callback if set
    await this.notify(traceId, key, result)
    
    return result
  }

  // === TRANSACTION SUPPORT ===

  async transaction<T>(traceId: string, operations: StateOperation[], depth = 0): Promise<TransactionResult<T>> {
    const result = await this.stateManager.transaction<T>(traceId, operations)
    
    // Notify state change callbacks for mutating operations only if transaction was successful
    if (result.success && this.stateChangeCallback) {
      for (const operation of operations) {
        // Only notify for mutating operations, skip 'get' operations
        if (!MUTATING_OPS.has(operation.type)) continue
        
        try {
          // Get the current value after transaction
          const currentValue = await this.stateManager.get(traceId, operation.key)
          await this.notify(traceId, operation.key, currentValue, depth)
        } catch (error) {
          console.error('[StateWrapper] State change callback failed:', error)
        }
      }
    }
    
    return result
  }

  // === BATCH OPERATIONS ===

  async batch<T>(traceId: string, operations: BatchOperation[], depth = 0): Promise<BatchResult<T>> {
    const result = await this.stateManager.batch<T>(traceId, operations)
    
    // Notify state change callbacks for successful mutating operations
    if (this.stateChangeCallback) {
      for (const operationResult of result.results) {
        if (!operationResult.error && operationResult.id) {
          // Find the operation by id to get the key
          const operation = operations.find(op => op.id === operationResult.id)
          if (operation && MUTATING_OPS.has(operation.type)) {
            try {
              // Get the current value after batch operation
              const currentValue = await this.stateManager.get(traceId, operation.key)
              await this.notify(traceId, operation.key, currentValue, depth)
            } catch (error) {
              console.error('[StateWrapper] State change callback failed:', error)
            }
          }
        }
      }
    }
    
    return result
  }

  // === UTILITY OPERATIONS ===

  async exists(traceId: string, key: string): Promise<boolean> {
    return this.stateManager.exists(traceId, key)
  }
}
