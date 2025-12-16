import IORedis, { type Redis } from 'ioredis'
import type { BullMQConnectionConfig } from './types'

export class ConnectionManager {
  readonly connection: Redis
  readonly ownsConnection: boolean
  private isClosed: boolean

  constructor(config: BullMQConnectionConfig) {
    if (config instanceof IORedis) {
      this.connection = config
      this.ownsConnection = false
    } else {
      this.connection = new IORedis({
        maxRetriesPerRequest: null,
        ...config,
      })
      this.ownsConnection = true
    }

    this.isClosed = false

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.connection.on('error', (err: Error) => {
      if (!this.isClosed) {
        console.warn('[BullMQ] Connection error:', err?.message)
      }
    })

    this.connection.on('close', () => {
      this.isClosed = true
      console.warn('[BullMQ] Connection closed')
    })
  }

  async close(): Promise<void> {
    if (this.ownsConnection && this.connection.status !== 'end') {
      await this.connection.quit()
    }
  }
}
