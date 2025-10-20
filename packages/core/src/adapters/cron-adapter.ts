export interface CronLock {
    jobName: string
    lockId: string
    acquiredAt: number
    expiresAt: number
    instanceId: string
}

export interface CronLockInfo {
    jobName: string
    instanceId: string
    acquiredAt: number
    expiresAt: number
}

export interface CronAdapterConfig {
    lockTTL?: number
    lockRetryDelay?: number
    lockRetryAttempts?: number
    instanceId?: string
    enableHealthCheck?: boolean
}

export interface CronAdapter {
    acquireLock(jobName: string, ttl: number): Promise<CronLock | null>

    releaseLock(lock: CronLock): Promise<void>

    renewLock(lock: CronLock, ttl: number): Promise<boolean>

    isHealthy(): Promise<boolean>

    shutdown(): Promise<void>

    getActiveLocks(): Promise<CronLockInfo[]>
}

