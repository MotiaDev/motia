import { mkdirSync } from 'fs'
import type { RedisClientType } from 'redis'
import { RedisMemoryServer } from 'redis-memory-server'
import type { RedisMemoryInstancePropT } from 'redis-memory-server/lib/types'
import type { RedisConnectionInfo } from './types'

export class RedisMemoryManager {
  private server: RedisMemoryServer | null = null
  private client: RedisClientType | null = null
  private running = false

  private registerCleanupHandlers(): void {
    process.on('exit', async () => {
      await this.stop()
    })
    process.on('SIGTERM', async () => {
      await this.stop()
    })

    process.on('SIGINT', async () => {
      await this.stop()
    })
  }

  async startServer(baseDir: string): Promise<RedisConnectionInfo> {
    if (!this.server) {
      try {
        mkdirSync(baseDir, { recursive: true })

        const instance: RedisMemoryInstancePropT = {
          args: ['--appendonly', 'yes', '--appendfsync', 'everysec', '--save', '""', '--dir', baseDir],
        }

        if (process.env.MOTIA_REDIS_PORT) {
          instance.port = parseInt(process.env.MOTIA_REDIS_PORT || '6379')
        }

        this.server = new RedisMemoryServer({ instance })
        this.running = true
        this.registerCleanupHandlers()
      } catch (error) {
        console.error('[Redis Memory Server] Failed to start:', error)
        throw error
      }
    }

    const host = await this.server.getHost()
    const port = await this.server.getPort()

    return { host, port }
  }

  async stop(): Promise<void> {
    if (this.server && this.running) {
      try {
        await this.server.stop()
        this.running = false
      } catch (error: unknown) {
        console.error('[Redis Memory Server] Error stopping:', (error as Error)?.message)
      } finally {
        this.server = null
      }
    }
  }

  isRunning(): boolean {
    return this.running
  }

  getClient(): RedisClientType | null {
    return this.client
  }
}
