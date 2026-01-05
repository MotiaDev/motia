import { mkdirSync } from 'fs'
import type { RedisClientType } from 'redis'
import { RedisMemoryServer } from 'redis-memory-server'
import type { RedisMemoryInstancePropT } from 'redis-memory-server/lib/types'
import { ensureBuildTools } from '../utils/check-build-tools'
import { internalLogger } from '../utils/internal-logger'
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
        // Check for required build tools before attempting to start
        await ensureBuildTools()

        mkdirSync(baseDir, { recursive: true })

        const instance: RedisMemoryInstancePropT = {
          args: ['--appendonly', 'yes', '--appendfsync', 'everysec', '--save', '""', '--dir', baseDir],
        }

        if (process.env.MOTIA_REDIS_PORT) {
          instance.port = parseInt(process.env.MOTIA_REDIS_PORT || '6379')
        }

        this.server = new RedisMemoryServer({ instance })
        this.registerCleanupHandlers()
      } catch (error) {
        internalLogger.error('Failed to initialize Redis Memory Server')
        if (error instanceof Error) {
          console.error(error.message)
          if (process.env.LOG_LEVEL === 'debug' && error.stack) {
            console.error('\nStack trace:')
            console.error(error.stack)
          }
        }
        throw error
      }
    }

    try {
      const host = await this.server.getHost()
      const port = await this.server.getPort()

      this.running = true
      internalLogger.info('Redis Memory Server started', `${host}:${port}`)

      return { host, port }
    } catch (error) {
      internalLogger.error('Failed to start Redis Memory Server')

      if (error instanceof Error) {
        console.error(error.message)

        // Provide helpful suggestions based on common error patterns
        if (error.message.includes('make') || error.message.includes('compile')) {
          console.error('\nThis error typically occurs when build tools are missing.')
          console.error('Please ensure you have "make" and a C compiler installed.')
        }

        if (process.env.LOG_LEVEL === 'debug' && error.stack) {
          console.error('\nStack trace:')
          console.error(error.stack)
        }
      }

      console.error('\nAlternative: Use an external Redis server')
      console.error('  Set MOTIA_DISABLE_MEMORY_SERVER=true')
      console.error('  Set MOTIA_REDIS_HOST=<your-redis-host>')
      console.error('  Set MOTIA_REDIS_PORT=<your-redis-port> (default: 6379)')

      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.server && this.running) {
      try {
        await this.server.stop()
      } catch (error: unknown) {
        internalLogger.error('Error stopping Redis Memory Server', (error as Error)?.message)
      } finally {
        this.running = false
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
