import type { CronAdapter, CronLock, CronLockInfo } from '@motiadev/core'
import { createClient, type RedisClientOptions, type RedisClientType } from 'redis'
import { v4 as uuidv4 } from 'uuid'
import type { RedisCronAdapterOptions } from './types'

function isRedisClient(input: RedisClientType | RedisClientOptions): input is RedisClientType {
  return typeof input === 'object' && 'isOpen' in input && 'connect' in input
}

export class RedisCronAdapter implements CronAdapter {
  private client: RedisClientType
  private keyPrefix: string
  private lockTTL: number
  private lockRetryDelay: number
  private lockRetryAttempts: number
  private instanceId: string
  private enableHealthCheck: boolean
  private connected = false
  private isExternalClient: boolean

  constructor(redisConnection: RedisClientType | RedisClientOptions, options?: RedisCronAdapterOptions) {
    this.keyPrefix = options?.keyPrefix || 'motia:cron:lock:'
    this.lockTTL = options?.lockTTL || 300000
    this.lockRetryDelay = options?.lockRetryDelay || 1000
    this.lockRetryAttempts = options?.lockRetryAttempts || 0
    this.instanceId = options?.instanceId || `motia-${uuidv4()}`
    this.enableHealthCheck = options?.enableHealthCheck ?? true

    if (isRedisClient(redisConnection)) {
      this.client = redisConnection
      this.isExternalClient = true
      this.connected = this.client.isOpen
    } else {
      const config: RedisClientOptions = redisConnection
      this.isExternalClient = false

      this.client = createClient(config) as RedisClientType

      this.client.on('error', (err) => {
        console.error('[Redis Cron] Client error:', err)
      })

      this.client.on('connect', () => {
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

    const luaScript = `
      local current = redis.call('GET', KEYS[1])
      if not current then
        return 0
      end
      
      local lock = cjson.decode(current)
      if lock.lockId == ARGV[1] and lock.instanceId == ARGV[2] then
        return redis.call('DEL', KEYS[1])
      end
      
      return 0
    `

    try {
      await this.client.eval(luaScript, {
        keys: [key],
        arguments: [lock.lockId, lock.instanceId],
      })
    } catch (error) {
      console.error('[Redis Cron] Error releasing lock:', error)
    }
  }

  async renewLock(lock: CronLock, ttl: number): Promise<boolean> {
    await this.ensureConnected()

    const key = this.makeKey(lock.jobName)
    const now = Date.now()
    const expiresAt = now + ttl

    const renewedLock: CronLock = {
      ...lock,
      expiresAt,
    }

    const luaScript = `
      local current = redis.call('GET', KEYS[1])
      if not current then
        return 0
      end
      
      local lock = cjson.decode(current)
      if lock.lockId == ARGV[1] and lock.instanceId == ARGV[2] then
        redis.call('SET', KEYS[1], ARGV[3], 'PX', ARGV[4])
        return 1
      end
      
      return 0
    `

    try {
      const result = await this.client.eval(luaScript, {
        keys: [key],
        arguments: [lock.lockId, lock.instanceId, JSON.stringify(renewedLock), ttl.toString()],
      })

      return result === 1
    } catch (error) {
      console.error('[Redis Cron] Error renewing lock:', error)
      return false
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.enableHealthCheck) {
      return true
    }

    try {
      await this.ensureConnected()
      const result = await this.client.ping()
      return result === 'PONG'
    } catch {
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

    if (!this.isExternalClient && this.client.isOpen) {
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
    let cursor: string | number = '0'

    do {
      const result = await this.client.scan(cursor.toString(), {
        MATCH: pattern,
        COUNT: 100,
      })
      cursor = result.cursor
      keys.push(...result.keys)
    } while (String(cursor) !== '0')

    return keys
  }
}
