import { StreamAdapter } from '../../interfaces/stream-adapter.interface'

export class MemoryStreamAdapter<TData> extends StreamAdapter<TData> {
  private state: Record<string, unknown> = {}

  constructor(streamName: string) {
    super(streamName)
  }

  async init() {
    this.state = {}
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    const prefix = this._makeKeyPrefix(groupId)
    return Object.entries(this.state)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => {
        const id = key.split(':').pop()
        return { ...(value as object), id } as T
      })
  }

  async get<T>(groupId: string, id: string): Promise<T | null> {
    const key = this._makeKey(groupId, id)
    const value = this.state[key]

    return value ? ({ ...(value as object), id } as T) : null
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

  async clear(groupId: string): Promise<void> {
    const prefix = this._makeKeyPrefix(groupId)
    for (const key in this.state) {
      if (key.startsWith(prefix)) {
        delete this.state[key]
      }
    }
  }

  private _makeKeyPrefix(groupId: string) {
    return `${this.streamName}:${groupId}`
  }

  private _makeKey(groupId: string, id: string) {
    return `${this.streamName}:${groupId}:${id}`
  }
}
