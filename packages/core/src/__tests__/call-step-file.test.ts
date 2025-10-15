import { CreateUploadUrlOptions } from '@motia/storage'
import { randomUUID } from 'crypto'
import path from 'path'
import { callStepFile } from '../call-step-file'
import { s3WebhookHandler } from '../endpoints/s3-webhook-endpoint'
import { createEventManager } from '../event-manager'
import { LockedData } from '../locked-data'
import { Logger } from '../logger'
import { Motia } from '../motia'
import { NoTracer } from '../observability/no-tracer'
import { NoPrinter } from '../printer'
import { StorageService } from '../services/storage-service'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { EventManager } from '../types'
import { createCronStep } from './fixtures/step-fixtures'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mockCreateUploadUrl = jest.fn().mockImplementation((options) => {
  return Promise.resolve('http://s3.upload.url')
})

const storageEnvs = {
  STORAGE_REGION: 'us-east-1',
  STORAGE_ACCESS_KEY_ID: 'mock-access-key',
  STORAGE_SECRET_ACCESS_KEY: 'mock-secret-key',
  STORAGE_BUCKET: 'mock-bucket',
  STORAGE_WEBHOOK_SECRET: 'test-storage-secret',
}

describe('callStepFile', () => {
  let lockedData: LockedData
  let eventManager: EventManager
  let state: MemoryStateAdapter
  let printer: NoPrinter
  let stepDir: string
  let logger: Logger
  let tracer: NoTracer
  let traceId: string

  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  beforeEach(() => {
    stepDir = path.join(__dirname, 'steps')
    printer = new NoPrinter()
    state = new MemoryStateAdapter()
    lockedData = new LockedData(stepDir, 'memory', printer)
    eventManager = createEventManager()
    traceId = randomUUID()
    logger = new Logger()
    tracer = new NoTracer()

    jest.spyOn(StorageService, 'getInstance').mockReset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call the cron step file with onlyContext true', async () => {
    const step = createCronStep({ emits: ['TEST_EVENT'], cron: '* * * * *' }, path.join(stepDir, 'cron-step.ts'))
    const motia: Motia = {
      eventManager,
      state,
      printer,
      lockedData,
      loggerFactory: { create: () => logger },
      tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
    }

    jest.spyOn(eventManager, 'emit').mockImplementation(() => Promise.resolve())

    await callStepFile({ step, traceId, logger, contextInFirstArg: true, tracer }, motia)

    expect(eventManager.emit).toHaveBeenCalledWith(
      {
        topic: 'TEST_EVENT',
        data: { test: 'data' },
        flows: ['motia-server'],
        traceId,
        logger: expect.anything(),
        tracer: expect.anything(),
      },
      step.filePath,
    )
  })

  it('should create an upload url and emit an event on upload', async () => {
    const traceId = randomUUID()
    const logger = new Logger()
    const tracer = new NoTracer()

    mockStorageService()

    const step = createCronStep({}, path.join(stepDir, 'storage-step.ts'))

    const motia: Motia = {
      eventManager,
      state,
      printer,
      lockedData,
      loggerFactory: { create: () => logger },
      tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
      storage: StorageService.getInstance({ provider: 's3' }, lockedData),
    }

    jest.spyOn(eventManager, 'emit').mockImplementation(() => Promise.resolve())

    await callStepFile({ step, traceId, logger, contextInFirstArg: true, tracer }, motia)

    expect(mockCreateUploadUrl).toHaveBeenCalledWith({
      path: '/path/to/folder/image.png',
      acceptMime: ['image/png'],
      onUpload: {
        emit: 'image-uploaded',
        payload: {
          fileId: '123',
        },
      },
    })

    const onUploadMetadataStream = lockedData.getOnUploadMetadataStream()
    const metadata = await onUploadMetadataStream().get('default', '/path/to/folder/image.png')

    expect(metadata).toEqual({
      path: '/path/to/folder/image.png',
      emit: 'image-uploaded',
      payload: {
        fileId: '123',
      },
      expiresAt: expect.any(Number),
    })

    const req = {
      body: {
        Records: [
          {
            eventSource: 'aws:s3',
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: {
                name: 'test-bucket',
              },
              object: {
                key: '/path/to/folder/image.png',
              },
            },
          },
        ],
      },
      headers: { 'x-motia-secret': storageEnvs.STORAGE_WEBHOOK_SECRET },
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await s3WebhookHandler(req as any, res as any, motia)

    expect(eventManager.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'image-uploaded',
        data: {
          path: '/path/to/folder/image.png',
          bucket: 'test-bucket',
          fileId: '123',
        },
      }),
    )
  })

  it('should create an upload url without emitting an event on upload when onUpload is not provided', async () => {
    const traceId = randomUUID()
    const logger = new Logger()
    const tracer = new NoTracer()

    mockStorageService()

    const step = createCronStep({}, path.join(stepDir, 'storage-step-no-event.ts'))

    const motia: Motia = {
      eventManager,
      state,
      printer,
      lockedData,
      loggerFactory: { create: () => logger },
      tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
      storage: StorageService.getInstance({ provider: 's3' }, lockedData),
    }

    jest.spyOn(eventManager, 'emit').mockImplementation(() => Promise.resolve())

    await callStepFile({ step, traceId, logger, contextInFirstArg: true, tracer }, motia)

    const req = {
      body: {
        Records: [
          {
            eventSource: 'aws:s3',
            eventName: 'ObjectCreated:Put',
            s3: {
              bucket: {
                name: 'test-bucket',
              },
              object: {
                key: '/path/to/folder/document.pdf',
              },
            },
          },
        ],
      },
      headers: { 'x-motia-secret': storageEnvs.STORAGE_WEBHOOK_SECRET },
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await s3WebhookHandler(req as any, res as any, motia)

    expect(mockCreateUploadUrl).toHaveBeenCalledWith({
      path: '/path/to/folder/document.pdf',
      acceptMime: ['application/pdf'],
    })

    const onUploadMetadataStream = lockedData.getOnUploadMetadataStream()
    const metadata = await onUploadMetadataStream().get('default', '/path/to/folder/document.pdf')
    expect(metadata).toBeNull()
    expect(eventManager.emit).not.toHaveBeenCalledWith(
      expect.objectContaining({
        topic: expect.any(String),
      }),
    )
  })

  it('should throw an error if storage is not configured but step tries to use it', async () => {
    const traceId = randomUUID()
    const logger = new Logger()
    const tracer = new NoTracer()

    const stepName = 'StorageStepNoStorage'

    const step = createCronStep({ name: stepName }, path.join(stepDir, 'storage-step.ts'))

    const motia: Motia = {
      eventManager,
      state,
      printer,
      lockedData,
      loggerFactory: { create: () => logger },
      tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
    }

    await expect(callStepFile({ step, traceId, logger, contextInFirstArg: true, tracer }, motia)).rejects.toThrow(
      `Storage service is not initialized but step ${stepName} is trying to use it.`,
    )
  })

  it('should throw an error if storage env vars are not configured but step tries to use it', async () => {
    const traceId = randomUUID()
    const logger = new Logger()
    const tracer = new NoTracer()

    const stepName = 'StorageStepNoEnvironmentVars'

    const step = createCronStep({ name: stepName }, path.join(stepDir, 'storage-step.ts'))

    const motia: Motia = {
      eventManager,
      state,
      printer,
      lockedData,
      loggerFactory: { create: () => logger },
      tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
      storage: StorageService.getInstance({ provider: 's3' }, lockedData),
    }

    await expect(callStepFile({ step, traceId, logger, contextInFirstArg: true, tracer }, motia)).rejects.toThrow(
      `Storage service is not initialized but step ${stepName} is trying to use it.`,
    )
  })
})

const setupStorageEnvVariables = (vars: { [key: string]: string }) => {
  process.env.STORAGE_REGION = vars.STORAGE_REGION
  process.env.STORAGE_ACCESS_KEY_ID = vars.STORAGE_ACCESS_KEY_ID
  process.env.STORAGE_SECRET_ACCESS_KEY = vars.STORAGE_SECRET_ACCESS_KEY
  process.env.STORAGE_BUCKET = vars.STORAGE_BUCKET
  process.env.STORAGE_WEBHOOK_SECRET = vars.STORAGE_WEBHOOK_SECRET
}

function mockStorageService() {
  setupStorageEnvVariables(storageEnvs)

  jest.spyOn(StorageService, 'getInstance').mockImplementation((config, lockedDataFromMock) => {
    return {
      getProvider: () => ({
        createUploadUrl: async (options: CreateUploadUrlOptions) => {
          mockCreateUploadUrl(options)
          if (options.onUpload) {
            const onUploadMetadataStream = lockedDataFromMock?.getOnUploadMetadataStream()
            await onUploadMetadataStream?.().set('default', options.path, {
              path: options.path,
              emit: options.onUpload.emit,
              payload: options.onUpload.payload,
              expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
            })
          }
          return Promise.resolve('http://s3.upload.url')
        },
      }),
      close: jest.fn(),
    } as unknown as StorageService
  })
}
