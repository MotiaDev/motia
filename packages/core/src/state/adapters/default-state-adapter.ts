import { StateAdapter } from '../state-adapter'
import fs from 'fs'
import * as path from 'path'

export type FileAdapterConfig = {
  adapter: 'default'
  filePath: string
}

export class FileStateAdapter implements StateAdapter {
  private filePath: string

  constructor(config: FileAdapterConfig) {
    this.filePath = path.join(config.filePath, 'motia.state.json')
  }

  async init() {
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

  async get(traceId: string, key: string) {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)

    return data[fullKey] ? JSON.parse(data[fullKey]) : null
  }

  async set<T>(traceId: string, key: string, value: T) {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)

    data[fullKey] = JSON.stringify(value)

    this._writeFile(data)

    return value
  }

  async delete(traceId: string, key: string) {
    const data = this._readFile()
    const fullKey = this._makeKey(traceId, key)

    delete data[fullKey]

    this._writeFile(data)
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

  async cleanup() {
    // No cleanup needed for file system
  }

  private _makeKey(traceId: string, key: string) {
    return `${traceId}:${key}`
  }

  private _readFile(): Record<string, string> {
    const content = fs.readFileSync(this.filePath, 'utf-8')
    return JSON.parse(content)
  }

  private _writeFile(data: unknown) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }
}
