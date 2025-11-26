import { jest } from '@jest/globals'
import path from 'path'
import request from 'supertest'
import { fileURLToPath } from 'url'
import type { LockedData } from '../locked-data'
import type { ApiMiddleware, ApiRouteConfig, Step } from '../types'
import { createMockRedisClient } from './test-helpers/redis-client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Mock callStepFile
const mockCallStepFile = jest.fn().mockImplementation(async () => ({
  status: 200,
  body: { success: true, middlewareApplied: true },
}))

jest.unstable_mockModule('../call-step-file', () => ({
  callStepFile: mockCallStepFile,
}))

const { createServer } = await import('../server')
const { InMemoryCronAdapter, InMemoryQueueEventAdapter } = await import('../adapters/defaults')
const { MemoryStateAdapter } = await import('../adapters/defaults/state/memory-state-adapter')
const { MemoryStreamAdapter } = await import('../adapters/defaults/stream/memory-stream-adapter')
const { Printer } = await import('../printer')

describe('Middleware Management', () => {
  let server: ReturnType<typeof createServer>

  const testMiddleware: ApiMiddleware<{ middlewareApplied: boolean }, unknown, unknown> = async (req, _, next) => {
    req.body.middlewareApplied = true
    return next()
  }

  const blockingMiddleware: ApiMiddleware<unknown, unknown, { error: string }> = async () => {
    return {
      status: 403,
      body: { error: 'Access denied by middleware' },
    }
  }

  beforeEach(async () => {
    // Set test mode environment variable
    process.env._MOTIA_TEST_MODE = 'true'
    mockCallStepFile.mockClear()

    const baseDir = path.resolve(__dirname)
    const printer = new Printer(baseDir)
    const lockedData = {
      printer,
      activeSteps: [],
      eventSteps: () => [],
      cronSteps: () => [],
      onStep: () => {},
      applyStreamWrapper: () => {},
      createStream: () => () => new MemoryStreamAdapter('test-stream'),
      setStreamAuthConfig: () => {},
      getStreamAuthConfig: () => undefined,
      getStreamByName: () => undefined,
      baseDir,
      on: () => {},
      redisClient: createMockRedisClient(),
    } as unknown as LockedData

    const state = new MemoryStateAdapter()
    const config = { isVerbose: true, isDev: true, version: '1.0.0' }

    server = createServer(lockedData, state, config, {
      eventAdapter: new InMemoryQueueEventAdapter(),
      cronAdapter: new InMemoryCronAdapter(),
    })
  })

  afterEach(async () => {
    if (server) {
      await server.close()
    }
  })

  it('should apply middleware when adding a route', async () => {
    // Reset default implementation
    mockCallStepFile.mockImplementation(async () => ({
      status: 200,
      body: { success: true, middlewareApplied: true },
    }))

    const step: Step<ApiRouteConfig> = {
      filePath: path.join(__dirname, 'steps', 'api-step.ts'),
      version: '1.0.0',
      config: {
        type: 'api',
        name: 'test-middleware-step',
        path: '/test-middleware-route',
        method: 'POST',
        emits: [],
        middleware: [testMiddleware],
      },
    }

    server.addRoute(step)

    const response = await request(server.app).post('/test-middleware-route').send({ test: 'data' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true, middlewareApplied: true })
  })

  it('should remove route with middleware', async () => {
    const step: Step<ApiRouteConfig> = {
      filePath: path.join(__dirname, 'steps', 'api-step.ts'),
      version: '1.0.0',
      config: {
        type: 'api',
        name: 'removable-middleware-step',
        path: '/removable-route',
        method: 'GET',
        emits: [],
        middleware: [testMiddleware],
      },
    }

    server.addRoute(step)

    server.removeRoute(step)

    const response = await request(server.app).get('/removable-route')

    expect(response.status).toBe(404)
  })

  it('should update middleware when re-adding a route', async () => {
    // First, set up normal behavior
    mockCallStepFile.mockImplementation(async () => ({
      status: 200,
      body: { success: true },
    }))

    const step: Step<ApiRouteConfig> = {
      filePath: path.join(__dirname, 'steps', 'api-step.ts'),
      version: '1.0.0',
      config: {
        type: 'api',
        name: 'updatable-middleware-step',
        path: '/updatable-route',
        method: 'POST',
        emits: [],
        middleware: [testMiddleware],
      },
    }

    server.addRoute(step)
    server.removeRoute(step)

    // Change implementation to simulate the blocking middleware
    mockCallStepFile.mockImplementation(async () => ({
      status: 403,
      body: { error: 'Access denied by middleware' },
    }))

    step.config.middleware = [blockingMiddleware]
    server.addRoute(step)

    const response = await request(server.app).post('/updatable-route').send({ test: 'data' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Access denied by middleware' })
  })
})
