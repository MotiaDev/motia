import request from 'supertest'
import path from 'path'
import { createServer } from '../server'
import { ApiMiddleware, ApiRouteConfig, Step } from '../types'
import { LockedData } from '../locked-data'
import { createEventManager } from '../event-manager'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { Printer } from '../printer'

describe('Middleware Management', () => {
  let server: ReturnType<typeof createServer> extends Promise<infer T> ? T : never

  const testMiddleware: ApiMiddleware = async (req, _, next) => {
    req.body.middlewareApplied = true
    return next()
  }

  const blockingMiddleware: ApiMiddleware = async () => {
    return {
      status: 403,
      body: { error: 'Access denied by middleware' },
    }
  }

  beforeAll(async () => {
    const baseDir = path.resolve(__dirname)
    const printer = new Printer(baseDir)
    const lockedData = {
      printer,
      activeSteps: [],
      eventSteps: () => [],
      cronSteps: () => [],
    } as unknown as LockedData

    const eventManager = createEventManager()
    const state = new MemoryStateAdapter()

    server = await createServer(lockedData, eventManager, state, { isVerbose: false })
  })

  afterAll(async () => {
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

    expect(response.status).toBe(500)
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

    step.config.middleware = [blockingMiddleware]
    server.addRoute(step)

    const response = await request(server.app).post('/updatable-route').send({ test: 'data' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Access denied by middleware' })
  })
})
