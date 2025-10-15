import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { LockedData } from '@motiadev/core'
import { S3StorageProvider } from '../../providers/s3'

// Mock the AWS SDK S3Client and getSignedUrl
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => 'mock-signed-url'),
}))

describe('S3StorageProvider', () => {
  const storageEnvs = {
    STORAGE_REGION: 'us-east-1',
    STORAGE_ACCESS_KEY_ID: 'mock-access-key',
    STORAGE_SECRET_ACCESS_KEY: 'mock-secret-key',
    STORAGE_BUCKET: 'mock-bucket',
    STORAGE_WEBHOOK_SECRET: 'test-storage-secret',
  }

  let provider: S3StorageProvider
  let mockS3Client: jest.Mocked<S3Client>
  let mockPutObjectCommand: jest.Mocked<typeof PutObjectCommand>
  let mockGetSignedUrl: jest.Mocked<typeof getSignedUrl>
  let mockLockedData: jest.Mocked<LockedData>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStreamAdapterInstance: any

  beforeEach(() => {
    jest.clearAllMocks()
    setupStorageEnvVariables(storageEnvs)

    mockStreamAdapterInstance = {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    }
    mockLockedData = {
      getOnUploadMetadataStream: jest.fn(() => () => mockStreamAdapterInstance),
    } as unknown as jest.Mocked<LockedData>
    provider = new S3StorageProvider(mockLockedData)
    mockS3Client = (S3Client as jest.Mock).mock.results[0].value
    mockPutObjectCommand = PutObjectCommand as jest.Mocked<typeof PutObjectCommand>
    mockGetSignedUrl = getSignedUrl as jest.Mocked<typeof getSignedUrl>
  })

  it('should initialize S3Client with correct options', () => {
    expect(S3Client).toHaveBeenCalledTimes(1)
    expect(S3Client).toHaveBeenCalledWith({
      region: storageEnvs.STORAGE_REGION,
      credentials: {
        accessKeyId: storageEnvs.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: storageEnvs.STORAGE_SECRET_ACCESS_KEY,
      },
    })
  })

  it('should create a signed upload URL', async () => {
    const path = 'test/image.png'
    const acceptMime = ['image/png']

    const url = await provider.createUploadUrl({
      path,
      acceptMime,
    })

    expect(mockPutObjectCommand).toHaveBeenCalledTimes(1)
    expect(mockPutObjectCommand).toHaveBeenCalledWith({
      Bucket: storageEnvs.STORAGE_BUCKET,
      Key: path,
      ContentType: acceptMime[0],
    })
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)
    expect(mockGetSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.any(PutObjectCommand), {
      expiresIn: 3600,
    })
    expect(url).toBe('mock-signed-url')
  })

  it('should store onUpload metadata if provided', async () => {
    const path = 'test/document.pdf'
    const emitTopic = 'document-uploaded'
    const payload = { userId: '123' }

    const setSpy = jest.spyOn(mockStreamAdapterInstance, 'set')

    await provider.createUploadUrl({
      path,
      onUpload: {
        emit: emitTopic,
        payload,
      },
    })

    expect(setSpy).toHaveBeenCalledTimes(1)
    expect(setSpy).toHaveBeenCalledWith('default', path, {
      path,
      emit: emitTopic,
      payload,
      expiresAt: expect.any(Number),
    })
  })
})

const setupStorageEnvVariables = (vars: { [key: string]: string }) => {
  process.env.STORAGE_REGION = vars.STORAGE_REGION
  process.env.STORAGE_ACCESS_KEY_ID = vars.STORAGE_ACCESS_KEY_ID
  process.env.STORAGE_SECRET_ACCESS_KEY = vars.STORAGE_SECRET_ACCESS_KEY
  process.env.STORAGE_BUCKET = vars.STORAGE_BUCKET
  process.env.STORAGE_WEBHOOK_SECRET = vars.STORAGE_WEBHOOK_SECRET
}
