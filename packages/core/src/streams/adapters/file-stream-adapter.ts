import fs from 'fs'
import * as path from 'path'
import type { BaseStreamItem } from '../../types-stream'
import { StreamAdapter } from './stream-adapter'

export type FileAdapterConfig = {
  filePath: string
}

export class FileStreamAdapter<TData> extends StreamAdapter<TData> {
  private readonly filePath: string
  private readonly streamsDir: string

  constructor(filePath: string, streamName: string, motiaFileStoragePath: string = '.motia') {
    super()
    this.streamsDir = path.join(filePath, motiaFileStoragePath, 'streams')
    this.filePath = path.join(this.streamsDir, `${streamName}.stream.json`)
  }

  init() {
    try {
      fs.realpathSync(this.streamsDir)
    } catch {
      fs.mkdirSync(this.streamsDir, { recursive: true })
    }

    try {
      fs.readFileSync(this.filePath, 'utf-8')
    } catch {
      fs.writeFileSync(this.filePath, JSON.stringify({}), 'utf-8')
    }
  }

  async getGroup(groupId: string): Promise<BaseStreamItem<TData>[]> {
    const data = this._readFile()

    return Object.entries(data)
      .filter(([key]) => key.startsWith(groupId))
      .map(([, value]) => JSON.parse(value) as BaseStreamItem<TData>)
  }

  async get(groupId: string, key: string): Promise<BaseStreamItem<TData> | null> {
    const data = this._readFile()
    const fullKey = this._makeKey(groupId, key)

    return data[fullKey] ? (JSON.parse(data[fullKey]) as BaseStreamItem<TData>) : null
  }

  async set(groupId: string, id: string, value: TData) {
    const data = this._readFile()
    const key = this._makeKey(groupId, id)

    data[key] = JSON.stringify(value)

    this._writeFile(data)

    return { ...value, id }
  }

  async delete(groupId: string, id: string): Promise<BaseStreamItem<TData> | null> {
    const data = this._readFile()
    const key = this._makeKey(groupId, id)
    const value = await this.get(groupId, id)

    if (value) {
      delete data[key]
      this._writeFile(data)
    }

    return value
  }

  async clear(groupId: string) {
    const data = this._readFile()
    const pattern = this._makeKey(groupId, '')

    for (const key in data) {
      if (key.startsWith(pattern)) {
        delete data[key]
      }
    }

    this._writeFile(data)
  }

  protected _makeKey(groupId: string, id: string) {
    return `${groupId}:${id}`
  }

  protected _readFile(): Record<string, string> {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      this.init()
      return {}
    }
  }

  protected _writeFile(data: unknown) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      this.init()
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    }
  }
}
