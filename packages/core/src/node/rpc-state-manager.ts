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

  async delete(traceId: string, key: string) {
    await this.sender.send('state.delete', { traceId, key })
  }

  async clear(traceId: string) {
    await this.sender.send('state.clear', { traceId })
  }
}
