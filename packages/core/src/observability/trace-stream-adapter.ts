import { FileStreamAdapter } from '../streams/adapters/file-stream-adapter'
import type { BaseStreamItem } from '../types-stream'

export class TraceStreamAdapter<TData> extends FileStreamAdapter<TData> {
  private state: Record<string, unknown> = {}
  private isDirty = false

  constructor(filePath: string, streamName: string, streamAdapter: 'file' | 'memory') {
    super(filePath ?? '', streamName)

    if (streamAdapter === 'file') {
      const state: Record<string, string | object> = this._readFile()

      Object.entries(state).forEach(([key, value]) => {
        if (typeof value === 'string') {
          this.state[key] = JSON.parse(value) as BaseStreamItem<TData>
        } else {
          this.state[key] = value as BaseStreamItem<TData>
        }
      })

      setInterval(() => {
        if (this.isDirty) {
          this._writeFile(this.state)
          this.isDirty = false
        }
      }, 30_000)
    }
  }

  async get(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const key = this._makeKey(groupId, id)

    return this.state[key] ? (this.state[key] as BaseStreamItem<TData>) : null
  }

  async set(groupId: string, id: string, data: TData): Promise<BaseStreamItem<TData>> {
    const key = this._makeKey(groupId, id)

    this.state[key] = data
    this.isDirty = true

    return { ...data, id }
  }

  async delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const key = this._makeKey(groupId, id)
    const value = await this.get(groupId, id)

    if (value) {
      delete this.state[key]
      this.isDirty = true
    }

    return value
  }

  async getGroup(groupId: string): Promise<BaseStreamItem<TData>[]> {
    return Object.entries(this.state)
      .filter(([key]) => key.startsWith(groupId))
      .map(([, value]) => value as BaseStreamItem<TData>)
  }
}
