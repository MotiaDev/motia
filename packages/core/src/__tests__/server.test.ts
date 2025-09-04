import path from 'path'
import request from 'supertest'
import { createEventManager } from '../event-manager'
import { LockedData } from '../locked-data'
import { NoPrinter } from '../printer'
import { createServer, type MotiaServer } from '../server'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import type { ApiRouteConfig, Step } from '../types'
import { createApiStep } from './fixtures/step-fixtures'

const config = { isVerbose: true }

describe('Server', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  describe('CORS', () => {
    const baseDir = path.join(__dirname, 'steps')
    let server: MotiaServer

    beforeEach(async () => {
      const lockedData = new LockedData(baseDir, 'memory', new NoPrinter())
      const eventManager = createEventManager()
      const state = new MemoryStateAdapter()
      server = await createServer(lockedData, eventManager, state, config)
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
      const lockedData = new LockedData(baseDir, 'memory', new NoPrinter())
      const eventManager = createEventManager()
      const state = new MemoryStateAdapter()
      server = await createServer(lockedData, eventManager, state, config)
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
      const eventManager = createEventManager()
      const state = new MemoryStateAdapter()
      const baseDir = __dirname
      const lockedData = new LockedData(baseDir, 'memory', new NoPrinter())
      const mockApiStep: Step<ApiRouteConfig> = createApiStep(
        { emits: ['TEST_EVENT'], path: '/test', method: 'POST' },
        path.join(baseDir, 'steps', 'api-step.ts'),
      )

      lockedData.createStep(mockApiStep, { disableTypeCreation: true })

      const server = await createServer(lockedData, eventManager, state, config)

      const response = await request(server.app).post('/test')
      expect(response.status).toBe(200)

      server.removeRoute(mockApiStep)

      const notFound = await request(server.app).post('/test')
      expect(notFound.status).toBe(404)

      server.addRoute(mockApiStep)

      const found = await request(server.app).post('/test')
      expect(found.status).toBe(200)

      await server.close()
    })
  })
})
