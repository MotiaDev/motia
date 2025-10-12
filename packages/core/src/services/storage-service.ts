import { S3StorageProvider, StorageProvider } from '@motia/storage'
import { LockedData } from '../locked-data'
import { globalLogger } from '../logger'
import { StorageConfig } from '../types/app-config-types'

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

export class StorageService {
  private static instance: StorageService
  private provider: StorageProvider
  private lockedData: LockedData
  private cleanupInterval: NodeJS.Timeout | undefined

  private constructor(provider: StorageProvider, lockedData: LockedData) {
    this.lockedData = lockedData
    this.provider = provider

    this.startCleanupJob()
  }

  public static getInstance(config?: StorageConfig, lockedData?: LockedData): StorageService | undefined {
    if (!config || !lockedData) {
      if (!StorageService.instance) {
        throw new Error('StorageService not initialized or missing LockedData')
      }

      return StorageService.instance
    }

    if (StorageService.instance) {
      return StorageService.instance
    }

    if (config.provider === 's3') {
      const region = process.env.STORAGE_REGION
      const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID
      const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY
      const bucket = process.env.STORAGE_BUCKET

      if (!region || !accessKeyId || !secretAccessKey || !bucket) {
        globalLogger.warn(
          'Missing S3 environment variables: STORAGE_REGION, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_BUCKET must be set. S3 Storage will not be available.',
        )
        return undefined
      }

      StorageService.instance = new StorageService(new S3StorageProvider(lockedData), lockedData)
    } else {
      throw new Error('Unsupported storage provider')
    }

    return StorageService.instance
  }

  public getProvider(): StorageProvider {
    return this.provider
  }

  private startCleanupJob(): void {
    this.cleanupInterval = setInterval(() => this.cleanupOnUploadMetadata(), CLEANUP_INTERVAL_MS)

    globalLogger.info('StorageService: Started onUploadMetadata cleanup job.')
  }

  private async cleanupOnUploadMetadata(): Promise<void> {
    const stream = this.lockedData.getOnUploadMetadataStream()
    const now = Date.now()

    try {
      const allMetadata = await stream().getGroup('default')

      for (const metadataItem of allMetadata) {
        if (metadataItem.expiresAt && metadataItem.expiresAt < now) {
          await stream().delete('default', metadataItem.path)

          globalLogger.debug(`StorageService: Cleaned up expired onUploadMetadata for path: ${metadataItem.path}`)
        }
      }
    } catch (error) {
      globalLogger.error('StorageService: Error during onUploadMetadata cleanup', { error })
    }
  }

  public close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      globalLogger.info('StorageService: Stopped onUploadMetadata cleanup job.')
    }
  }
}
