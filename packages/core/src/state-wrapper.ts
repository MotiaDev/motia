import { InternalStateManager } from './types'

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

  async atomicUpdate<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T> {
    if (this.stateManager.atomicUpdate) {
      const result = await this.stateManager.atomicUpdate(traceId, key, updateFn)
      
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
    } else {
      // Fallback to regular set operation if atomicUpdate is not available
      const currentValue = await this.get<T>(traceId, key)
      const newValue = updateFn(currentValue)
      return await this.set(traceId, key, newValue)
    }
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    return this.stateManager.getGroup<T>(groupId)
  }
}
