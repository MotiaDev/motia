import { InternalStateManager } from '../types'
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

  async atomicUpdate<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    // For RPC mode, we need to extract the operation from the function
    // This is a simplified approach that works for the score updater use case
    
    // Get current value to determine the operation
    const currentValue = await this.get<T>(traceId, key)
    const newValue = updateFn(currentValue)
    
    // Determine the operation type based on the values
    let operation: string
    let value: number
    
    if (typeof currentValue === 'number' && typeof newValue === 'number') {
      const diff = newValue - (currentValue as number)
      if (diff > 0) {
        operation = 'add'
        value = diff
      } else if (diff < 0) {
        operation = 'subtract'
        value = Math.abs(diff)
      } else {
        operation = 'set'
        value = newValue
      }
    } else {
      operation = 'set'
      value = newValue as number
    }
    
    // Send the operation to the server
    return this.sender.send<T>('state.atomicUpdate', { traceId, key, operation, value })
  }
}
