import { OnUploadMetadata } from '@motiadev/core/src/types/storage-types'

export interface CreateUploadUrlOptions {
  path: string
  acceptMime?: string[]
  onUpload?: Omit<OnUploadMetadata, 'path'>
}

export interface StorageProvider {
  createUploadUrl(options: CreateUploadUrlOptions): Promise<string>
}
