import { StateAdapter, StateItem, StateItemsInput } from '../state-adapter'
import { StateOperation, BatchOperation, TransactionResult, BatchResult } from '../../types'
import { globalStatePerformanceMonitor } from '../../performance/state-performance-monitor'
import { filterItem, inferType } from './utils'

export class MemoryStateAdapter implements StateAdapter {
  private state: Record<string, unknown> = {}
  private lockQueues: Map<string, Array<() => void>> = new Map()
  private lockedKeys: Set<string> = new Set()

  constructor() {
    this.state = {}
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    return Object.entries(this.state)
      .filter(([key]) => key.startsWith(groupId))
      .map(([, value]) => value as T)
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this._makeKey(traceId, key)

    return fullKey in this.state ? (this.state[fullKey] as T) : null
  }

  async set<T>(traceId: string, key: string, value: T) {
    const fullKey = this._makeKey(traceId, key)
    
    // Always use locking for atomicity
    await this._acquireLock(fullKey)
    try {
      this.state[fullKey] = value
      return value
    } finally {
      this._releaseLock(fullKey)
    }
  }

  async update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    const endOperation = globalStatePerformanceMonitor.startOperation('update')
    const fullKey = this._makeKey(traceId, key)
    
    // Wait for lock to be available
    await this._acquireLock(fullKey)
    
    try {
      const currentValue = this.state[fullKey] as T | null
      const newValue = updateFn(currentValue)
      this.state[fullKey] = newValue
      return newValue
    } finally {
      // Release the lock
      this._releaseLock(fullKey)
      endOperation()
    }
  }


  private async _acquireLock(key: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.lockedKeys.has(key)) {
        // No lock exists, acquire it immediately
        this.lockedKeys.add(key)
        resolve()
        return
      }
      
      // Lock exists, record contention and add to queue
      globalStatePerformanceMonitor.recordLockContention(key)
      if (!this.lockQueues.has(key)) {
        this.lockQueues.set(key, [])
      }
      this.lockQueues.get(key)!.push(resolve)
    })
  }

  private _releaseLock(key: string): void {
    this.lockedKeys.delete(key)
    
    const queue = this.lockQueues.get(key)
    if (queue && queue.length > 0) {
      const nextResolver = queue.shift()!
      this.lockedKeys.add(key)
      nextResolver()
    } else {
      this.lockQueues.delete(key)
    }
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this._makeKey(traceId, key)
    const value = await this.get<T>(traceId, key)

    if (value) {
      delete this.state[fullKey]
    }

    return value
  }

  async clear(traceId: string) {
    const pattern = this._makeKey(traceId, '')

    for (const key in this.state) {
      if (key.startsWith(pattern)) {
        delete this.state[key]
      }
    }
  }

  async keys(traceId: string) {
    return Object.keys(this.state)
      .filter((key) => key.startsWith(this._makeKey(traceId, '')))
      .map((key) => key.replace(this._makeKey(traceId, ''), ''))
  }

  async traceIds() {
    const traceIds = new Set<string>()

    Object.keys(this.state).forEach((key) => traceIds.add(key.split(':')[0]))

    return Array.from(traceIds)
  }

  async items(input: StateItemsInput): Promise<StateItem[]> {
    return Object.entries(this.state)
      .map(([key, value]) => ({
        groupId: key.split(':')[0],
        key: key.split(':')[1],
        type: inferType(value),
        value: value as StateItem['value'],
      }))
      .filter((item) => (input.groupId ? item.groupId === input.groupId : true))
      .filter((item) => (input.filter ? filterItem(item, input.filter) : true))
  }

  async cleanup() {
    // No cleanup needed for memory
  }

  // === NEW ATOMIC PRIMITIVES ===

  async increment(traceId: string, key: string, delta = 1): Promise<number> {
    return this.update(traceId, key, (current: any) => {
      if (current !== null && current !== undefined && typeof current !== 'number') {
        throw new Error(`Cannot increment non-numeric value: ${current}`)
      }
      return (current || 0) + delta
    })
  }

  async decrement(traceId: string, key: string, delta = 1): Promise<number> {
    return this.update(traceId, key, (current: any) => {
      if (current !== null && current !== undefined && typeof current !== 'number') {
        throw new Error(`Cannot decrement non-numeric value: ${current}`)
      }
      return Math.max(0, (current || 0) - delta)
    })
  }

  async compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean> {
    const fullKey = this._makeKey(traceId, key)
    await this._acquireLock(fullKey)
    
    try {
      const current = this.state[fullKey] as T | null
      
      // Use JSON comparison for objects to handle deep equality
      let isEqual: boolean
      if (current === expected) {
        isEqual = true
      } else if (current === null || expected === null) {
        isEqual = false
      } else if (typeof current === 'object' && typeof expected === 'object') {
        // For objects, compare serialized JSON to handle deep equality
        try {
          isEqual = JSON.stringify(current) === JSON.stringify(expected)
        } catch {
          // If JSON serialization fails, fall back to strict equality
          isEqual = false
        }
      } else {
        isEqual = false
      }
      
      if (isEqual) {
        this.state[fullKey] = newValue
        return true
      }
      return false
    } finally {
      this._releaseLock(fullKey)
    }
  }

  // === ATOMIC ARRAY OPERATIONS ===

  async push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    return this.update(traceId, key, (current: T[] | null) => {
      const array = current || []
      return [...array, ...items]
    })
  }

  async pop<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this._makeKey(traceId, key)
    await this._acquireLock(fullKey)
    
    try {
      const current = this.state[fullKey] as T[] | null
      const array = current || []
      if (array.length === 0) return null
      
      const removedItem = array[array.length - 1]
      this.state[fullKey] = array.slice(0, -1)
      return removedItem
    } finally {
      this._releaseLock(fullKey)
    }
  }

  async shift<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this._makeKey(traceId, key)
    await this._acquireLock(fullKey)
    
    try {
      const current = this.state[fullKey] as T[] | null
      const array = current || []
      if (array.length === 0) return null
      
      const removedItem = array[0]
      this.state[fullKey] = array.slice(1)
      return removedItem
    } finally {
      this._releaseLock(fullKey)
    }
  }

  async unshift<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    return this.update(traceId, key, (current: T[] | null) => {
      const array = current || []
      return [...items, ...array]
    })
  }

  // === ATOMIC OBJECT OPERATIONS ===

  async setField<T>(traceId: string, key: string, field: string, value: any): Promise<T> {
    return this.update(traceId, key, (current: T | null) => {
      const obj = current || ({} as T)
      return { ...obj, [field]: value }
    })
  }

  async deleteField<T>(traceId: string, key: string, field: string): Promise<T> {
    return this.update(traceId, key, (current: T | null) => {
      const obj = current || ({} as T)
      const { [field as keyof T]: _, ...rest } = obj
      return rest as T
    })
  }

  // === TRANSACTION SUPPORT ===

  async transaction<T>(traceId: string, operations: StateOperation[]): Promise<TransactionResult<T>> {
    // Get all unique keys involved in the transaction
    const keys = [...new Set(operations.map(op => this._makeKey(traceId, op.key)))]
    
    // Acquire locks for all keys in sorted order to prevent deadlocks
    // Acquire locks sequentially to avoid deadlocks
    for (const key of keys.sort()) {
      await this._acquireLock(key)
    }
    
    try {
      const results: T[] = []
      for (const operation of operations) {
        const result = await this._executeOperation(traceId, operation)
        results.push(result as T)
      }
      return { success: true, results }
    } catch (error) {
      return { success: false, results: [], error: error instanceof Error ? error.message : String(error) }
    } finally {
      // Release all locks
      keys.forEach(key => this._releaseLock(key))
    }
  }

  // === BATCH OPERATIONS ===

  async batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>> {
    // For batch operations, we can execute them in parallel since they're independent
    const results = await Promise.allSettled(
      operations.map(async (operation) => {
        try {
          const value = await this._executeOperation(traceId, operation)
          return { id: operation.id, value, error: undefined }
        } catch (error) {
          return { 
            id: operation.id, 
            value: undefined as T, 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      })
    )

    return {
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { 
          id: undefined, 
          value: undefined as T, 
          error: 'Operation failed' 
        }
      ) as Array<{ id?: string; value: T; error?: string }>
    }
  }

  // === UTILITY OPERATIONS ===

  async exists(traceId: string, key: string): Promise<boolean> {
    const fullKey = this._makeKey(traceId, key)
    return fullKey in this.state
  }

  // === PRIVATE HELPER METHODS ===

  private async _executeOperation<T>(traceId: string, operation: StateOperation): Promise<T> {
    const fullKey = this._makeKey(traceId, operation.key)
    
    switch (operation.type) {
      case 'get':
        return (this.state[fullKey] ?? null) as T
      case 'set':
        this.state[fullKey] = operation.value
        return operation.value as T
      case 'update':
        if (!operation.updateFn) throw new Error('Update function required for update operation')
        const current = this.state[fullKey] as T | null
        const updated = operation.updateFn(current)
        this.state[fullKey] = updated
        return updated
      case 'delete':
        const deleted = this.state[fullKey] as T | null
        delete this.state[fullKey]
        return deleted as T
      case 'increment':
        const currentNum = (this.state[fullKey] as number) || 0
        const newNum = currentNum + (operation.delta || 1)
        this.state[fullKey] = newNum
        return newNum as T
      case 'decrement':
        const currentDec = (this.state[fullKey] as number) || 0
        const newDec = Math.max(0, currentDec - (operation.delta || 1))
        this.state[fullKey] = newDec
        return newDec as T
      case 'compareAndSwap':
        const currentCas = this.state[fullKey] as T | null
        if (currentCas === operation.expected) {
          this.state[fullKey] = operation.value
          return true as T
        }
        return false as T
      case 'push':
        const currentArray = (this.state[fullKey] as T[]) || []
        const newArray = [...currentArray, ...(operation.items || [])]
        this.state[fullKey] = newArray
        return newArray as T
      case 'pop':
        const currentPop = (this.state[fullKey] as T[]) || []
        if (currentPop.length === 0) return null as T
        const removed = currentPop[currentPop.length - 1]
        this.state[fullKey] = currentPop.slice(0, -1)
        return removed as T
      case 'shift':
        const currentShift = (this.state[fullKey] as T[]) || []
        if (currentShift.length === 0) return null as T
        const shifted = currentShift[0]
        this.state[fullKey] = currentShift.slice(1)
        return shifted as T
      case 'unshift':
        const currentUnshift = (this.state[fullKey] as T[]) || []
        const newUnshift = [...(operation.items || []), ...currentUnshift]
        this.state[fullKey] = newUnshift
        return newUnshift as T
      case 'setField':
        if (!operation.field) throw new Error('Field required for setField operation')
        const currentObj = (this.state[fullKey] as T) || ({} as T)
        const newObj = { ...currentObj, [operation.field]: operation.value }
        this.state[fullKey] = newObj
        return newObj
      case 'deleteField':
        if (!operation.field) throw new Error('Field required for deleteField operation')
        const currentDel = (this.state[fullKey] as T) || ({} as T)
        const { [operation.field as keyof T]: _, ...rest } = currentDel
        this.state[fullKey] = rest as T
        return rest as T
      default:
        throw new Error(`Unsupported operation type: ${(operation as any).type}`)
    }
  }

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }
}
