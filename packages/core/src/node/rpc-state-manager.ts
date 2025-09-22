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

  async update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    // For RPC, we need to pass the function as a string, but this loses closures
    // We'll pass the function string and let the server handle it
    return this.sender.send<T>('state.update', { 
      traceId, 
      key, 
      updateFn: updateFn.toString() 
    })
  }

  async atomicUpdate<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    // Delegate to the new update method for consistency
    return this.update(traceId, key, updateFn)
  }
}
