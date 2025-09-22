import fs from 'fs'
import * as path from 'path'
import { StateAdapter, StateItem, StateItemsInput } from '../state-adapter'
import { StateOperation, BatchOperation, TransactionResult, BatchResult } from '../../types'
import { filterItem, inferType } from './utils'

export type FileAdapterConfig = {
  adapter: 'default'
  filePath: string
}

export class FileStateAdapter implements StateAdapter {
  private readonly filePath: string

  constructor(config: FileAdapterConfig) {
    this.filePath = path.join(config.filePath, 'motia.state.json')
    this.init()
  }

  init() {
    const dir = this.filePath.replace('motia.state.json', '')
    try {
      fs.realpathSync(dir)
    } catch {
      fs.mkdirSync(dir, { recursive: true })
    }

    try {
      fs.readFileSync(this.filePath, 'utf-8')
    } catch {
      fs.writeFileSync(this.filePath, JSON.stringify({}), 'utf-8')
    }
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    const data = this._readFile()

    return Object.entries(data)
      .filter(([key]) => key.startsWith(groupId))
      .map(([, value]) => JSON.parse(value) as T)
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)

    return fullKey in data ? (JSON.parse(data[fullKey]) as T) : null
  }

  async set<T>(traceId: string, key: string, value: T) {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)

    data[fullKey] = JSON.stringify(value)

    // Atomic file write operation
    this._writeFile(data)

    return value
  }

  async update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)
    
    const currentValue = data[fullKey] ? JSON.parse(data[fullKey]) as T : null
    const newValue = updateFn(currentValue)
    data[fullKey] = JSON.stringify(newValue)
    
    // Atomic file write operation
    this._writeFile(data)
    
    return newValue
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)
    const value = await this.get<T>(traceId, key)

    if (value) {
      delete data[fullKey]
      this._writeFile(data)
    }

    return value
  }

  async clear(traceId: string) {
    const data = this._readFile()
    const pattern = this._makeKey(traceId, '')

    for (const key in data) {
      if (key.startsWith(pattern)) {
        delete data[key]
      }
    }

    this._writeFile(data)
  }

  async keys(traceId: string) {
    const data = this._readFile()
    return Object.keys(data)
      .filter((key) => key.startsWith(this._makeKey(traceId, '')))
      .map((key) => key.replace(this._makeKey(traceId, ''), ''))
  }

  async traceIds() {
    const data = this._readFile()
    const traceIds = new Set<string>()

    Object.keys(data).forEach((key) => traceIds.add(key.split(':')[0]))

    return Array.from(traceIds)
  }

  async cleanup() {
    // No cleanup needed for file system
  }

  async items(input: StateItemsInput): Promise<StateItem[]> {
    const data = this._readFile()

    return Object.entries(data)
      .map(([key, value]) => {
        const [groupId, itemKey] = key.split(':')
        const itemValue = JSON.parse(value)
        return { groupId, key: itemKey, value: itemValue, type: inferType(itemValue) }
      })
      .filter((item) => (input.groupId ? item.groupId === input.groupId : true))
      .filter((item) => (input.filter ? filterItem(item, input.filter) : true))
  }

  // === NEW ATOMIC PRIMITIVES ===

  async increment(traceId: string, key: string, delta = 1): Promise<number> {
    return this.update(traceId, key, (current: number | null) => {
      return (current || 0) + delta
    })
  }

  async decrement(traceId: string, key: string, delta = 1): Promise<number> {
    return this.update(traceId, key, (current: number | null) => {
      return Math.max(0, (current || 0) - delta)
    })
  }

  async compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)
    
    const current = data[fullKey] ? JSON.parse(data[fullKey]) as T : null
    
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
      data[fullKey] = JSON.stringify(newValue)
      this._writeFile(data)
      return true
    }
    return false
  }

  // === ATOMIC ARRAY OPERATIONS ===

  async push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]> {
    return this.update(traceId, key, (current: T[] | null) => {
      const array = current || []
      return [...array, ...items]
    })
  }

  async pop<T>(traceId: string, key: string): Promise<T | null> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)
    
    const current = data[fullKey] ? JSON.parse(data[fullKey]) as T[] : null
    const array = current || []
    if (array.length === 0) return null
    
    const removedItem = array[array.length - 1]
    data[fullKey] = JSON.stringify(array.slice(0, -1))
    this._writeFile(data)
    return removedItem
  }

  async shift<T>(traceId: string, key: string): Promise<T | null> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)
    
    const current = data[fullKey] ? JSON.parse(data[fullKey]) as T[] : null
    const array = current || []
    if (array.length === 0) return null
    
    const removedItem = array[0]
    data[fullKey] = JSON.stringify(array.slice(1))
    this._writeFile(data)
    return removedItem
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
    const data = this._readFile()
    
    try {
      const results: T[] = []
      for (const operation of operations) {
        const result = await this._executeOperation(traceId, operation, data)
        results.push(result as T)
      }
      this._writeFile(data)
      return { success: true, results }
    } catch (error) {
      return { success: false, results: [], error: error instanceof Error ? error.message : String(error) }
    }
  }

  // === BATCH OPERATIONS ===

  async batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>> {
    // For batch operations, we can execute them in parallel since they're independent
    const results = await Promise.allSettled(
      operations.map(async (operation) => {
        try {
          const value = await this._executeOperation(traceId, operation, this._readFile())
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
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)
    return fullKey in data
  }

  // === PRIVATE HELPER METHODS ===

  private async _executeOperation<T>(traceId: string, operation: StateOperation, data: Record<string, string>): Promise<T> {
    switch (operation.type) {
      case 'get':
        const fullKey = this._makeKey(traceId, operation.key)
        return data[fullKey] ? JSON.parse(data[fullKey]) as T : null as T
      case 'set':
        data[this._makeKey(traceId, operation.key)] = JSON.stringify(operation.value)
        return operation.value
      case 'update':
        if (!operation.updateFn) throw new Error('Update function required for update operation')
        const currentValue = data[this._makeKey(traceId, operation.key)] ? JSON.parse(data[this._makeKey(traceId, operation.key)]) as T : null
        const newValue = operation.updateFn(currentValue)
        data[this._makeKey(traceId, operation.key)] = JSON.stringify(newValue)
        return newValue
      case 'delete':
        const deleteKey = this._makeKey(traceId, operation.key)
        const deleteValue = data[deleteKey] ? JSON.parse(data[deleteKey]) as T : null
        delete data[deleteKey]
        return deleteValue as T
      case 'increment':
        const incKey = this._makeKey(traceId, operation.key)
        const incCurrent = data[incKey] ? JSON.parse(data[incKey]) as number : 0
        const incNew = incCurrent + (operation.delta || 1)
        data[incKey] = JSON.stringify(incNew)
        return incNew as T
      case 'decrement':
        const decKey = this._makeKey(traceId, operation.key)
        const decCurrent = data[decKey] ? JSON.parse(data[decKey]) as number : 0
        const decNew = Math.max(0, decCurrent - (operation.delta || 1))
        data[decKey] = JSON.stringify(decNew)
        return decNew as T
      case 'compareAndSwap':
        const casKey = this._makeKey(traceId, operation.key)
        const casCurrent = data[casKey] ? JSON.parse(data[casKey]) as T : null
        if (casCurrent === operation.expected) {
          data[casKey] = JSON.stringify(operation.value)
          return true as T
        }
        return false as T
      case 'push':
        const pushKey = this._makeKey(traceId, operation.key)
        const pushCurrent = data[pushKey] ? JSON.parse(data[pushKey]) as T[] : []
        const pushNew = [...pushCurrent, ...(operation.items || [])]
        data[pushKey] = JSON.stringify(pushNew)
        return pushNew as T
      case 'pop':
        const popKey = this._makeKey(traceId, operation.key)
        const popCurrent = data[popKey] ? JSON.parse(data[popKey]) as T[] : []
        if (popCurrent.length === 0) return null as T
        const popRemoved = popCurrent[popCurrent.length - 1]
        data[popKey] = JSON.stringify(popCurrent.slice(0, -1))
        return popRemoved
      case 'shift':
        const shiftKey = this._makeKey(traceId, operation.key)
        const shiftCurrent = data[shiftKey] ? JSON.parse(data[shiftKey]) as T[] : []
        if (shiftCurrent.length === 0) return null as T
        const shiftRemoved = shiftCurrent[0]
        data[shiftKey] = JSON.stringify(shiftCurrent.slice(1))
        return shiftRemoved
      case 'unshift':
        const unshiftKey = this._makeKey(traceId, operation.key)
        const unshiftCurrent = data[unshiftKey] ? JSON.parse(data[unshiftKey]) as T[] : []
        const unshiftNew = [...(operation.items || []), ...unshiftCurrent]
        data[unshiftKey] = JSON.stringify(unshiftNew)
        return unshiftNew as T
      case 'setField':
        if (!operation.field) throw new Error('Field required for setField operation')
        const setFieldKey = this._makeKey(traceId, operation.key)
        const setFieldCurrent = data[setFieldKey] ? JSON.parse(data[setFieldKey]) as T : ({} as T)
        const setFieldNew = { ...setFieldCurrent, [operation.field]: operation.value }
        data[setFieldKey] = JSON.stringify(setFieldNew)
        return setFieldNew
      case 'deleteField':
        if (!operation.field) throw new Error('Field required for deleteField operation')
        const deleteFieldKey = this._makeKey(traceId, operation.key)
        const deleteFieldCurrent = data[deleteFieldKey] ? JSON.parse(data[deleteFieldKey]) as T : ({} as T)
        const { [operation.field as keyof T]: _, ...deleteFieldRest } = deleteFieldCurrent
        data[deleteFieldKey] = JSON.stringify(deleteFieldRest)
        return deleteFieldRest as T
      default:
        throw new Error(`Unsupported operation type: ${(operation as any).type}`)
    }
  }

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }

  private _readFile(): Record<string, string> {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      this.init()
      return {}
    }
  }

  private _writeFile(data: unknown) {
    const tempPath = this.filePath + '.tmp'
    const jsonData = JSON.stringify(data, null, 2)
    
    try {
      // Write to temporary file first
      fs.writeFileSync(tempPath, jsonData, 'utf-8')
      
      // Atomically rename temp file to final location (atomic on POSIX systems)
      fs.renameSync(tempPath, this.filePath)
    } catch (error) {
      // Clean up temp file if it exists
      try {
        fs.unlinkSync(tempPath)
      } catch {
        // Ignore cleanup errors
      }
      
      // Fallback: try to initialize and write directly
      this.init()
      fs.writeFileSync(this.filePath, jsonData, 'utf-8')
    }
  }
}
