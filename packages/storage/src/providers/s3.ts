import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { LockedData } from '@motiadev/core/src/locked-data'
import { CreateUploadUrlOptions, StorageProvider } from '../provider'

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly lockedData: LockedData

  constructor(lockedData: LockedData) {
    const region = process.env.STORAGE_REGION as string
    const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID as string
    const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY as string
    const bucket = process.env.STORAGE_BUCKET as string

    const endpoint = process.env.STORAGE_ENDPOINT
    const forcePathStyle = process.env.STORAGE_FORCE_PATH_STYLE === 'true'

    this.client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      ...(endpoint && { endpoint }),
      ...(forcePathStyle && { forcePathStyle }),
    })
    this.bucket = bucket
    this.lockedData = lockedData
  }

  async createUploadUrl(options: CreateUploadUrlOptions): Promise<string> {
    if (options.onUpload) {
      const onUploadMetadataStream = this.lockedData.getOnUploadMetadataStream()

      await onUploadMetadataStream().set('default', options.path, {
        path: options.path,
        emit: options.onUpload.emit,
        payload: options.onUpload.payload,
        expiresAt: Date.now() + 3600 * 1000,
      })
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.path,
      ContentType: options.acceptMime?.[0],
    })

    return getSignedUrl(this.client, command, { expiresIn: 3600 })
  }
}
