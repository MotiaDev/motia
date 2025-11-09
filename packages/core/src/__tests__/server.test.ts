import path from 'path'
import { DefaultLoggerAdapter } from 'src/adapters/defaults/logger/default-logger-adapter'
import { BaseTracerAdapter } from 'src/observability/tracer'
import request from 'supertest'
import { InMemoryCronAdapter, InMemoryQueueEventAdapter, MemoryStreamAdapterManager } from '../adapters/defaults'
import { MemoryStateAdapter } from '../adapters/defaults/state/memory-state-adapter'
import { LockedData } from '../locked-data'
import { NoPrinter } from '../printer'
import { createServer, type MotiaServer } from '../server'
import type { ApiRouteConfig, Step } from '../types'
import { createApiStep } from './fixtures/step-fixtures'

const config = { isVerbose: true, isDev: true, version: '1.0.0' }

const defaultTestAdapterOptions = {
  eventAdapter: new InMemoryQueueEventAdapter(),
  cronAdapter: new InMemoryCronAdapter(),
  streamAdapter: new MemoryStreamAdapterManager(),
  observabilityAdapter: {
    tracerAdapter: new BaseTracerAdapter(new MemoryStreamAdapterManager()),
    loggerAdapter: new DefaultLoggerAdapter(true),
  },
}

describe('Server', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  describe('CORS', () => {
    const baseDir = path.join(__dirname, 'steps')
    let server: MotiaServer

    beforeEach(async () => {
      const lockedData = new LockedData(baseDir, new MemoryStreamAdapterManager(), new NoPrinter())
      const state = new MemoryStateAdapter()
      server = await createServer(lockedData, state, config, {
        ...defaultTestAdapterOptions,
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
      const lockedData = new LockedData(baseDir, new MemoryStreamAdapterManager(), new NoPrinter())
      const state = new MemoryStateAdapter()
      server = await createServer(lockedData, state, config, {
        ...defaultTestAdapterOptions,
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

  describe('Router', () => {
    it('should create routes from locked data API steps', async () => {
      const state = new MemoryStateAdapter()
      const baseDir = __dirname
      const lockedData = new LockedData(baseDir, new MemoryStreamAdapterManager(), new NoPrinter())
      const mockApiStep: Step<ApiRouteConfig> = createApiStep(
        { emits: ['TEST_EVENT'], path: '/test', method: 'POST' },
        path.join(baseDir, 'steps', 'api-step.ts'),
      )

      lockedData.createStep(mockApiStep, { disableTypeCreation: true })

      const server = await createServer(lockedData, state, config, {
        ...defaultTestAdapterOptions,
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
