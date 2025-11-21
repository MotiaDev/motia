import { mkdirSync } from 'fs'
import { createClient, type RedisClientType } from 'redis'
import { RedisMemoryServer } from 'redis-memory-server'
import type { RedisMemoryInstancePropT } from 'redis-memory-server/lib/types'

export interface RedisConnectionInfo {
  host: string
  port: number
}

class RedisMemoryManager {
  private server: RedisMemoryServer | null = null
  private client: RedisClientType | null = null
  private running = false
  private cleanupHandlersRegistered = false

  private registerCleanupHandlers(): void {
    if (this.cleanupHandlersRegistered) return

    process.on('exit', () => {
      if (this.client?.isOpen && this.running) {
        this.client.quit().catch((error: unknown) => {
          console.error('[Redis Memory Server] Error closing client on exit:', error)
        })
      }
      if (this.server && this.running) {
        this.server.stop().catch((error: unknown) => {
          console.error('[Redis Memory Server] Error stopping on exit:', error)
        })
      }
    })

    process.on('SIGTERM', async () => {
      await this.stop()
    })

    process.on('SIGINT', async () => {
      await this.stop()
    })

    this.cleanupHandlersRegistered = true
  }

  async start(baseDir: string, autoStart: boolean): Promise<RedisClientType> {
    if (this.client && this.running) {
      return this.client
    }

    try {
      mkdirSync(baseDir, { recursive: true })

      const instance: RedisMemoryInstancePropT = {
        ip: process.env.MOTIA_REDIS_HOST || '127.0.0.1',
        args: ['--appendonly', 'yes', '--save', '900 1', '--save', '300 10', '--save', '60 100', '--dir', baseDir],
      }

      if (process.env.MOTIA_REDIS_PORT) {
        instance.port = parseInt(process.env.MOTIA_REDIS_PORT || '6379')
      }

      this.server = new RedisMemoryServer({
        instance,
        autoStart,
      })

      const host = await this.server.getHost()
      const port = await this.server.getPort()

      this.client = createClient({
        socket: {
          host,
          port,
          noDelay: true,
          keepAlive: true,
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              return new Error('Redis connection retry limit exceeded')
            }
            return Math.min(retries * 100, 3000)
          },
          connectTimeout: 10000,
        },
      })

      this.client.on('error', (err: Error) => {
        if (err.message.includes('ECONNRESET') || err.message.includes('ECONNREFUSED')) {
          return
        }
        console.error('[Redis Memory Server] Client error:', err)
      })

      await this.client.connect()

      this.running = true
      this.registerCleanupHandlers()
      console.log(`[Redis Memory Server] Started on ${host}:${port}`)

      return this.client
    } catch (error) {
      console.error('[Redis Memory Server] Failed to start:', error)
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.client && this.running) {
      try {
        if (this.client.isOpen) {
          await this.client.quit().catch((error: unknown) => {
            console.error('[Redis Memory Server] Error closing client:', error)
          })
        }
        this.client = null
      } catch (error) {}
    }

    if (this.server && this.running) {
      try {
        await this.server.stop()
        this.running = false
      } catch (error) {
        console.error('[Redis Memory Server] Error stopping:', error)
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

const manager = new RedisMemoryManager()

export const instanceRedisMemoryServer = (baseDir: string, autoStart: boolean = true): Promise<RedisClientType> =>
  manager.start(baseDir, autoStart)

export const stopRedisMemoryServer = (): Promise<void> => manager.stop()
