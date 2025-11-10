import fs from 'fs'
import * as path from 'path'
import type { StateAdapter, StateItem, StateItemsInput } from '../../interfaces/state-adapter.interface'
import { filterItem, inferType } from './utils'

export type FileAdapterConfig = {
  adapter: 'default'
  filePath: string
}

export class FileStateAdapter implements StateAdapter {
  private readonly filePath: string

  constructor(config: FileAdapterConfig) {
    this.filePath = path.join(config.filePath, 'motia.state.json')
    this.init()
  }

  init() {
    const dir = this.filePath.replace('motia.state.json', '')
    try {
      fs.realpathSync(dir)
    } catch {
      fs.mkdirSync(dir, { recursive: true })
    }

    try {
      fs.readFileSync(this.filePath, 'utf-8')
    } catch {
      fs.writeFileSync(this.filePath, JSON.stringify({}), 'utf-8')
    }
  }

  async getGroup<T>(groupId: string): Promise<T[]> {
    const data = this._readFile()

    return Object.entries(data)
      .filter(([key]) => key.startsWith(groupId))
      .map(([, value]) => JSON.parse(value) as T)
  }

  async get<T>(traceId: string, key: string): Promise<T | null> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)

    return data[fullKey] ? (JSON.parse(data[fullKey]) as T) : null
  }

  async set<T>(traceId: string, key: string, value: T) {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)

    data[fullKey] = JSON.stringify(value)

    this._writeFile(data)

    return value
  }

  async delete<T>(traceId: string, key: string): Promise<T | null> {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)
    const value = await this.get<T>(traceId, key)

    if (value) {
      delete data[fullKey]
      this._writeFile(data)
    }

    return value
  }

  async clear(traceId: string) {
    const data = this._readFile()
    const pattern = this._makeKey(traceId, '')

    for (const key in data) {
      if (key.startsWith(pattern)) {
        delete data[key]
      }
    }

    this._writeFile(data)
  }

  async keys(traceId: string) {
    const data = this._readFile()
    return Object.keys(data)
      .filter((key) => key.startsWith(this._makeKey(traceId, '')))
      .map((key) => key.replace(this._makeKey(traceId, ''), ''))
  }

  async traceIds() {
    const data = this._readFile()
    const traceIds = new Set<string>()

    Object.keys(data).forEach((key) => traceIds.add(key.split(':')[0]))

    return Array.from(traceIds)
  }

  async cleanup() {}

  async items(input: StateItemsInput): Promise<StateItem[]> {
    const data = this._readFile()

    return Object.entries(data)
      .map(([key, value]) => {
        const [groupId, ...keyParts] = key.split(':')
        const itemKey = keyParts.join(':')
        const itemValue = JSON.parse(value)
        return { groupId, key: itemKey, value: itemValue, type: inferType(itemValue) }
      })
      .filter((item) => (input.groupId ? item.groupId === input.groupId : true))
      .filter((item) => (input.filter ? filterItem(item, input.filter) : true))
  }

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }

  private _readFile(): Record<string, string> {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      this.init()
      return {}
    }
  }

  private _writeFile(data: unknown) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      this.init()
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    }
  }
}
