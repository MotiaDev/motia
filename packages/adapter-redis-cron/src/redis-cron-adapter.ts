import type { CronAdapter, CronLock, CronLockInfo } from '@motiadev/core'
import { createClient, type RedisClientType } from 'redis'
import { v4 as uuidv4 } from 'uuid'
import type { RedisCronAdapterConfig } from './types'

export class RedisCronAdapter implements CronAdapter {
  private client: RedisClientType
  private keyPrefix: string
  private lockTTL: number
  private lockRetryDelay: number
  private lockRetryAttempts: number
  private instanceId: string
  private enableHealthCheck: boolean
  private connected = false

  constructor(config: RedisCronAdapterConfig) {
    this.keyPrefix = config.keyPrefix || 'motia:cron:lock:'
    this.lockTTL = config.lockTTL || 300000
    this.lockRetryDelay = config.lockRetryDelay || 1000
    this.lockRetryAttempts = config.lockRetryAttempts || 0
    this.instanceId = config.instanceId || `motia-${uuidv4()}`
    this.enableHealthCheck = config.enableHealthCheck ?? true

    this.client = createClient({
      socket: {
        host: config.host || 'localhost',
        port: config.port || 6379,
        reconnectStrategy:
          config.socket?.reconnectStrategy ||
          ((retries) => {
            if (retries > 10) {
              return new Error('Redis connection retry limit exceeded')
            }
            return Math.min(retries * 100, 3000)
          }),
        connectTimeout: config.socket?.connectTimeout || 10000,
      },
      password: config.password,
      username: config.username,
      database: config.database || 0,
    })

    this.client.on('error', (err) => {
      console.error('[Redis Cron] Client error:', err)
    })

    this.client.on('connect', () => {
      console.log('[Redis Cron] Connected successfully')
      this.connected = true
    })

    this.client.on('disconnect', () => {
      console.warn('[Redis Cron] Disconnected')
      this.connected = false
    })

    this.client.on('reconnecting', () => {
      console.log('[Redis Cron] Reconnecting...')
    })

    this.connect()
  }

  private async connect(): Promise<void> {
    if (!this.connected && !this.client.isOpen) {
      try {
        await this.client.connect()
      } catch (error) {
        console.error('[Redis Cron] Failed to connect:', error)
        throw error
      }
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.client.isOpen) {
      await this.connect()
    }
  }

  private makeKey(jobName: string): string {
    return `${this.keyPrefix}${jobName}`
  }

  async acquireLock(jobName: string, ttl?: number): Promise<CronLock | null> {
    await this.ensureConnected()

    const lockTTL = ttl || this.lockTTL
    const lockId = uuidv4()
    const key = this.makeKey(jobName)
    const now = Date.now()
    const expiresAt = now + lockTTL

    const lock: CronLock = {
      jobName,
      lockId,
      acquiredAt: now,
      expiresAt,
      instanceId: this.instanceId,
    }

    const lockData = JSON.stringify(lock)

    const result = await this.client.set(key, lockData, {
      PX: lockTTL,
      NX: true,
    })

    if (result === 'OK') {
      return lock
    }

    if (this.lockRetryAttempts > 0) {
      for (let attempt = 0; attempt < this.lockRetryAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, this.lockRetryDelay))

        const retryResult = await this.client.set(key, lockData, {
          PX: lockTTL,
          NX: true,
        })

        if (retryResult === 'OK') {
          return lock
        }
      }
    }

    return null
  }

  async releaseLock(lock: CronLock): Promise<void> {
    await this.ensureConnected()

    const key = this.makeKey(lock.jobName)
    const currentLockData = await this.client.get(key)

    if (!currentLockData) {
      return
    }

    try {
      const currentLock: CronLock = JSON.parse(currentLockData)

      if (currentLock.lockId === lock.lockId && currentLock.instanceId === this.instanceId) {
        await this.client.del(key)
      }
    } catch (error) {
      console.error('[Redis Cron] Error releasing lock:', error)
    }
  }

  async renewLock(lock: CronLock, ttl: number): Promise<boolean> {
    await this.ensureConnected()

    const key = this.makeKey(lock.jobName)
    const currentLockData = await this.client.get(key)

    if (!currentLockData) {
      return false
    }

    try {
      const currentLock: CronLock = JSON.parse(currentLockData)

      if (currentLock.lockId === lock.lockId && currentLock.instanceId === this.instanceId) {
        const now = Date.now()
        const renewedLock: CronLock = {
          ...lock,
          expiresAt: now + ttl,
        }

        const result = await this.client.set(key, JSON.stringify(renewedLock), {
          PX: ttl,
          XX: true,
        })

        return result === 'OK'
      }
    } catch (error) {
      console.error('[Redis Cron] Error renewing lock:', error)
    }

    return false
  }

  async isHealthy(): Promise<boolean> {
    if (!this.enableHealthCheck) {
      return true
    }

    try {
      await this.ensureConnected()
      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      return false
    }
  }

  async shutdown(): Promise<void> {
    await this.ensureConnected()

    const pattern = `${this.keyPrefix}*`
    const keys = await this.scanKeys(pattern)

    for (const key of keys) {
      const lockData = await this.client.get(key)
      if (lockData) {
        try {
          const lock: CronLock = JSON.parse(lockData)
          if (lock.instanceId === this.instanceId) {
            await this.client.del(key)
          }
        } catch (error) {
          console.error('[Redis Cron] Error cleaning up lock during shutdown:', error)
        }
      }
    }

    if (this.client.isOpen) {
      await this.client.quit()
    }
  }

  async getActiveLocks(): Promise<CronLockInfo[]> {
    await this.ensureConnected()

    const pattern = `${this.keyPrefix}*`
    const keys = await this.scanKeys(pattern)
    const locks: CronLockInfo[] = []

    for (const key of keys) {
      const lockData = await this.client.get(key)
      if (lockData) {
        try {
          const lock: CronLock = JSON.parse(lockData)
          locks.push({
            jobName: lock.jobName,
            instanceId: lock.instanceId,
            acquiredAt: lock.acquiredAt,
            expiresAt: lock.expiresAt,
          })
        } catch (error) {
          console.error('[Redis Cron] Error parsing lock data:', error)
        }
      }
    }

    return locks
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = []
    let cursor = 0

    do {
      const result = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      })
      cursor = result.cursor
      keys.push(...result.keys)
    } while (cursor !== 0)

    return keys
  }
}
