import { jest } from '@jest/globals'
import path from 'path'
import request from 'supertest'
import { fileURLToPath } from 'url'
import { z } from 'zod'
import { InMemoryCronAdapter, InMemoryQueueEventAdapter, MemoryStreamAdapterManager } from '../adapters/defaults'
import { MemoryStateAdapter } from '../adapters/defaults/state/memory-state-adapter'
import { LockedData } from '../locked-data'
import { NoPrinter } from '../printer'
import type { MotiaServer } from '../server'
import type { ApiRouteConfig, Step } from '../types'
import type { StreamSubscription } from '../types-stream'
import { createApiStep } from './fixtures/step-fixtures'
import { config as remoteCanAccessConfig } from './steps/streams/remote-can-access.stream'
import { createMockRedisClient } from './test-helpers/redis-client'

jest.setTimeout(15000)

const socketServerOptions: Array<{
  authorize?: (
    subscription: { streamName: string; groupId: string; id?: string },
    authContext?: unknown,
  ) => Promise<boolean> | boolean
}> = []

const getLatestAuthorize = () => {
  const latest = socketServerOptions[socketServerOptions.length - 1]
  if (!latest?.authorize) {
    throw new Error('Socket server authorize handler not registered')
  }
  return latest.authorize
}

jest.unstable_mockModule('../socket-server', () => {
  return {
    createSocketServer: jest.fn((options) => {
      socketServerOptions.push(
        options as {
          authorize?: (
            subscription: { streamName: string; groupId: string; id?: string },
            authContext?: unknown,
          ) => Promise<boolean> | boolean
        },
      )
      return {
        pushEvent: jest.fn(),
        socketServer: {
          on: jest.fn(),
          close: jest.fn(),
        },
      }
    }),
  }
})

// Must dynamically import after mock is set up
const { createServer } = await import('../server')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config = { isVerbose: true, isDev: true, version: '1.0.0' }

describe('Server', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  afterEach(() => {
    socketServerOptions.length = 0
  })

  describe('CORS', () => {
    const baseDir = path.join(__dirname, 'steps')
    let server: MotiaServer

    beforeEach(async () => {
      const lockedData = new LockedData(
        baseDir,
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const state = new MemoryStateAdapter()
      server = createServer(lockedData, state, config, {
        eventAdapter: new InMemoryQueueEventAdapter(),
        cronAdapter: new InMemoryCronAdapter(),
      })
    })

    afterEach(async () => server?.close())

    it('should allow all origins', async () => {
      const response = await request(server.app).options('/')
      expect(response.status).toBe(204)
      expect(response.headers['access-control-allow-origin']).toBe('*')
    })
  })

  describe('API With multiple languages', () => {
    const baseDir = path.join(__dirname, 'steps')
    let server: MotiaServer

    beforeEach(async () => {
      const lockedData = new LockedData(
        baseDir,
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const state = new MemoryStateAdapter()
      server = createServer(lockedData, state, config, {
        eventAdapter: new InMemoryQueueEventAdapter(),
        cronAdapter: new InMemoryCronAdapter(),
      })
    })
    afterEach(async () => server?.close())

    it('should run node API steps', async () => {
      const mockApiStep: Step<ApiRouteConfig> = createApiStep(
        { emits: ['TEST_EVENT'], path: '/test', method: 'POST' },
        path.join(baseDir, 'api-step.ts'),
      )

      server.addRoute(mockApiStep)

      const response = await request(server.app).post('/test')
      expect(response.status).toBe(200)
      expect(response.body.traceId).toBeDefined()
    })

    it('should run python API steps', async () => {
      const mockApiStep: Step<ApiRouteConfig> = createApiStep(
        { emits: ['TEST_EVENT'], path: '/test', method: 'POST' },
        path.join(baseDir, 'api-step.py'),
      )

      server.addRoute(mockApiStep)

      const response = await request(server.app).post('/test')
      expect(response.status).toBe(200)
      expect(response.body.traceId).toBeDefined()
    })

    it.skip('should run ruby API steps', async () => {
      const mockApiStep: Step<ApiRouteConfig> = createApiStep(
        { emits: ['TEST_EVENT'], path: '/test', method: 'POST' },
        path.join(baseDir, 'api-step.rb'),
      )

      server.addRoute(mockApiStep)

      const response = await request(server.app).post('/test')
      expect(response.status).toBe(200)
      expect(response.body.traceId).toBeDefined()
    })
  })

  describe('Stream authorization', () => {
    const baseDir = path.join(__dirname, 'steps')

    const createTestServer = async (lockedData: LockedData) => {
      const state = new MemoryStateAdapter()
      return createServer(lockedData, state, config, {
        eventAdapter: new InMemoryQueueEventAdapter(),
        cronAdapter: new InMemoryCronAdapter(),
      })
    }

    it('uses inline canAccess implementations when available', async () => {
      const lockedData = new LockedData(
        baseDir,
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const canAccess = jest.fn().mockResolvedValue(true as never)
      lockedData.createStream(
        {
          filePath: path.join(baseDir, 'inline.stream.ts'),
          config: {
            name: 'inline-stream',
            schema: z.object({ groupId: z.string() }),
            baseConfig: { storageType: 'default' },
            canAccess: canAccess as (subscription: StreamSubscription, authContext: unknown) => boolean,
          },
        },
        { disableTypeCreation: true },
      )

      const server = await createTestServer(lockedData)
      const authorize = getLatestAuthorize()

      try {
        const allowed = await authorize({ streamName: 'inline-stream', groupId: 'public:1' })
        expect(canAccess).toHaveBeenCalledWith({ groupId: 'public:1', id: undefined }, undefined)
        expect(allowed).toBe(true)
      } finally {
        await server.close()
      }
    })

    it('evaluates remote canAccess implementations via runner', async () => {
      const lockedData = new LockedData(
        baseDir,
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const streamPath = path.join(baseDir, 'streams', 'remote-can-access.stream.ts')
      const remoteConfig = {
        ...remoteCanAccessConfig,
        baseConfig: remoteCanAccessConfig.baseConfig,
        schema: remoteCanAccessConfig.schema,
        canAccess: undefined,
        __motia_hasCanAccess: true,
      }

      lockedData.createStream({ filePath: streamPath, config: remoteConfig }, { disableTypeCreation: true })

      const server = await createTestServer(lockedData)
      const authorize = getLatestAuthorize()

      try {
        const authContext = { token: 'private-access' }
        const allowed = await authorize(
          { streamName: remoteCanAccessConfig.name, groupId: 'private-access' },
          authContext,
        )
        const denied = await authorize(
          { streamName: remoteCanAccessConfig.name, groupId: 'private-access' },
          { token: 'other' },
        )

        expect(allowed).toBe(true)
        expect(denied).toBe(false)
      } finally {
        await server.close()
      }
    })
  })

  describe('Router', () => {
    it('should create routes from locked data API steps', async () => {
      const state = new MemoryStateAdapter()
      const baseDir = __dirname
      const lockedData = new LockedData(
        baseDir,
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const mockApiStep: Step<ApiRouteConfig> = createApiStep(
        { emits: ['TEST_EVENT'], path: '/test', method: 'POST' },
        path.join(baseDir, 'steps', 'api-step.ts'),
      )

      lockedData.createStep(mockApiStep, { disableTypeCreation: true })

      const server = await createServer(lockedData, state, config, {
        eventAdapter: new InMemoryQueueEventAdapter(),
        cronAdapter: new InMemoryCronAdapter(),
      })

      const response = await request(server.app).post('/test')
      expect(response.status).toBe(200)

      server.removeRoute(mockApiStep)

      const notFound = await request(server.app).post('/test')
      expect(notFound.status).toBe(404)

      server.addRoute(mockApiStep)

      const found = await request(server.app).post('/test')
      expect(found.status).toBe(200)

      await server.close()
    }, 20000)
  })
})
