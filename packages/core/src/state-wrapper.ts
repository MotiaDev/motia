import { InternalStateManager, StateOperation, BatchOperation, TransactionResult, BatchResult } from './types'

export type StateChangeCallback = (traceId: string, key: string, value: any) => Promise<void>

export class StateWrapper implements InternalStateManager {
  private stateChangeCallback?: StateChangeCallback

  constructor(private readonly stateManager: InternalStateManager) {}

  setStateChangeCallback(callback: StateChangeCallback) {
    this.stateChangeCallback = callback
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    return this.stateManager.get<T>(traceId, key)
  }

  async set<T>(traceId: string, key: string, value: T): Promise<T> {
    const result = await this.stateManager.set<T>(traceId, key, value)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, value)
      } catch (error) {
        // Log error but don't fail the state operation
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    const result = await this.stateManager.update<T>(traceId, key, updateFn)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, result)
      } catch (error) {
        // Log error but don't fail the state operation
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const result = await this.stateManager.delete<T>(traceId, key)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, null) // null indicates deletion
      } catch (error) {
        // Log error but don't fail the state operation
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
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
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, result)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async decrement(traceId: string, key: string, delta = 1): Promise<number> {
    const result = await this.stateManager.decrement(traceId, key, delta)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, result)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean> {
    const result = await this.stateManager.compareAndSwap<T>(traceId, key, expected, newValue)
    
    // Only notify callback if the swap was successful
    if (result && this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, newValue)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  // === ATOMIC ARRAY OPERATIONS ===

  async push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    const result = await this.stateManager.push<T>(traceId, key, ...items)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, result)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async pop<T>(traceId: string, key: string): Promise<T | null> {
    const result = await this.stateManager.pop<T>(traceId, key)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        // Get the current state after pop to notify callback
        const currentState = await this.stateManager.get<T[]>(traceId, key)
        await this.stateChangeCallback(traceId, key, currentState)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async shift<T>(traceId: string, key: string): Promise<T | null> {
    const result = await this.stateManager.shift<T>(traceId, key)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        // Get the current state after shift to notify callback
        const currentState = await this.stateManager.get<T[]>(traceId, key)
        await this.stateChangeCallback(traceId, key, currentState)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async unshift<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    const result = await this.stateManager.unshift<T>(traceId, key, ...items)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, result)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  // === ATOMIC OBJECT OPERATIONS ===

  async setField<T>(traceId: string, key: string, field: string, value: any): Promise<T> {
    const result = await this.stateManager.setField<T>(traceId, key, field, value)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, result)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  async deleteField<T>(traceId: string, key: string, field: string): Promise<T> {
    const result = await this.stateManager.deleteField<T>(traceId, key, field)
    
    // Notify state change callback if set
    if (this.stateChangeCallback) {
      try {
        await this.stateChangeCallback(traceId, key, result)
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  // === TRANSACTION SUPPORT ===

  async transaction<T>(traceId: string, operations: StateOperation[]): Promise<TransactionResult<T>> {
    const result = await this.stateManager.transaction<T>(traceId, operations)
    
    // Notify state change callbacks for all operations if transaction was successful
    if (result.success && this.stateChangeCallback) {
      try {
        for (const operation of operations) {
          // Get the current value after transaction
          const currentValue = await this.stateManager.get(traceId, operation.key)
          await this.stateChangeCallback(traceId, operation.key, currentValue)
        }
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  // === BATCH OPERATIONS ===

  async batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>> {
    const result = await this.stateManager.batch<T>(traceId, operations)
    
    // Notify state change callbacks for successful operations
    if (this.stateChangeCallback) {
      try {
        for (const operationResult of result.results) {
          if (!operationResult.error && operationResult.id) {
            // Find the operation by id to get the key
            const operation = operations.find(op => op.id === operationResult.id)
            if (operation) {
              // Get the current value after batch operation
              const currentValue = await this.stateManager.get(traceId, operation.key)
              await this.stateChangeCallback(traceId, operation.key, currentValue)
            }
          }
        }
      } catch (error) {
        console.error('[StateWrapper] State change callback failed:', error)
      }
    }
    
    return result
  }

  // === UTILITY OPERATIONS ===

  async exists(traceId: string, key: string): Promise<boolean> {
    return this.stateManager.exists(traceId, key)
  }
}
