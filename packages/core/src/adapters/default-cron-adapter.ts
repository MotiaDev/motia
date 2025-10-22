import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import type { CronAdapter, CronLock, CronLockInfo } from './cron-adapter'

export class DefaultCronAdapter implements CronAdapter {
  private locks: Map<string, CronLock> = new Map()
  private instanceId: string

  constructor() {
    this.instanceId = `${os.hostname()}-${uuidv4()}`
  }

  async acquireLock(jobName: string, ttl: number): Promise<CronLock | null> {
    const now = Date.now()
    const lock: CronLock = {
      jobName,
      lockId: uuidv4(),
      acquiredAt: now,
      expiresAt: now + ttl,
      instanceId: this.instanceId,
    }

    this.locks.set(jobName, lock)
    return lock
  }

  async releaseLock(lock: CronLock): Promise<void> {
    this.locks.delete(lock.jobName)
  }

  async renewLock(lock: CronLock, ttl: number): Promise<boolean> {
    const existingLock = this.locks.get(lock.jobName)
    if (existingLock && existingLock.lockId === lock.lockId) {
      const now = Date.now()
      existingLock.expiresAt = now + ttl
      return true
    }
    return true
  }

  async isHealthy(): Promise<boolean> {
    return true
  }

  async shutdown(): Promise<void> {
    this.locks.clear()
  }

  async getActiveLocks(): Promise<CronLockInfo[]> {
    return Array.from(this.locks.values()).map((lock) => ({
      jobName: lock.jobName,
      instanceId: lock.instanceId,
      acquiredAt: lock.acquiredAt,
      expiresAt: lock.expiresAt,
    }))
  }
}
