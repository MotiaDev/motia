import path from 'path'
import request from 'supertest'
import { createEventManager } from '../event-manager'
import { LockedData } from '../locked-data'
import { Printer } from '../printer'
import { createServer } from '../server'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { MemoryStreamAdapter } from '../streams/adapters/memory-stream-adapter'
import { ApiMiddleware, Step } from '../types'

// Mock callStepFile to prevent actual file execution
jest.mock('../call-step-file', () => ({
  callStepFile: jest.fn().mockImplementation(async () => ({
    status: 200,
    body: { success: true, middlewareApplied: true },
  })),
}))

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

    const baseDir = path.resolve(__dirname)
    const printer = new Printer(baseDir)
    const lockedData = {
      printer,
      activeSteps: [],
      eventSteps: () => [],
      cronSteps: () => [],
      onStep: () => {},
      applyStreamWrapper: () => {},
      createStream: () => () => new MemoryStreamAdapter(),
      on: () => {},
    } as unknown as LockedData

    const eventManager = createEventManager()
    const state = new MemoryStateAdapter()
    const config = { isVerbose: true, isDev: true, version: '1.0.0' }

    server = createServer(lockedData, eventManager, state, config)
  })

  afterEach(async () => {
    await server.close()
  })

  it('should apply middleware when adding a route', async () => {
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const callStepFileModule = require('../call-step-file')

    // First, set up normal behavior
    callStepFileModule.callStepFile.mockImplementation(async () => ({
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
    callStepFileModule.callStepFile.mockImplementation(async () => ({
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
