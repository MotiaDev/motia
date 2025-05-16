import { StateAdapter } from '../state-adapter'

export class MemoryStateAdapter implements StateAdapter {
  private state: Record<string, unknown> = {}

  async init() {
    this.state = {}
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    const fullKey = this._makeKey(traceId, key)

    return this.state[fullKey] ? (this.state[fullKey] as T) : null
  }

  async set<T>(traceId: string, key: string, value: T) {
    const fullKey = this._makeKey(traceId, key)

    this.state[fullKey] = value

    return value
  }

  async delete(traceId: string, key: string) {
    const fullKey = this._makeKey(traceId, key)

    delete this.state[fullKey]
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

  async cleanup() {
    // No cleanup needed for file system
  }

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }
}
