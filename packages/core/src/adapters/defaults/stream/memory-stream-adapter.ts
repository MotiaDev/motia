import { StreamAdapter } from '../../interfaces/stream-adapter.interface'

export class MemoryStreamAdapter<TData> extends StreamAdapter<TData> {
  private state: Record<string, unknown> = {}

  async init() {
    this.state = {}
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    return Object.entries(this.state)
      .filter(([key]) => key.startsWith(groupId))
      .map(([, value]) => value as T)
  }

  async get<T>(groupId: string, id: string): Promise<T | null> {
    const key = this._makeKey(groupId, id)

    return this.state[key] ? (this.state[key] as T) : null
  }

  async set<T>(groupId: string, id: string, value: T) {
    const key = this._makeKey(groupId, id)

    this.state[key] = value

    return { ...value, id }
  }

  async delete<T>(groupId: string, id: string): Promise<T | null> {
    const key = this._makeKey(groupId, id)
    const value = await this.get<T>(groupId, id)

    if (value) {
      delete this.state[key]
    }

    return value
  }

  private _makeKey(groupId: string, id: string) {
    return `${groupId}:${id}`
  }
}
