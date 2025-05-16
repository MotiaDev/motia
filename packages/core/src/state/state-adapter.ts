/**
 * Interface for state management adapters
 */
export interface StateAdapter {
  get<T>(traceId: string, key: string): Promise<T | null>
  set<T>(traceId: string, key: string, value: T): Promise<T>
  delete(traceId: string, key: string): Promise<void>
  clear(traceId: string): Promise<void>
  cleanup(): Promise<void>

  keys(traceId: string): Promise<string[]>
  traceIds(): Promise<string[]>
}
