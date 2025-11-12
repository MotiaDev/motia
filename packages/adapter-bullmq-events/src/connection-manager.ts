import IORedis, { type Redis } from 'ioredis'
import { ConnectionError } from './errors'
import type { BullMQConnectionConfig } from './types'

export class ConnectionManager {
  readonly connection: Redis
  readonly ownsConnection: boolean

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

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.connection.on('error', (err: Error) => {
      const error = new ConnectionError(err.message, err)
      console.error('[BullMQ] Connection error:', error)
    })

    this.connection.on('close', () => {
      console.warn('[BullMQ] Connection closed')
    })
  }

  async close(): Promise<void> {
    if (this.ownsConnection && this.connection.status !== 'end') {
      await this.connection.quit()
    }
  }
}
