import path from 'path'
import fs from 'fs'
import os from 'os'
import request from 'supertest'
import { createServer } from '../server'
import { Printer } from '../printer'
import { createEventManager } from '../event-manager'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { MemoryStreamAdapter } from '../streams/adapters/memory-stream-adapter'
import { LockedData } from '../locked-data'
import { Step, ApiRouteConfig } from '../types'

jest.mock('../call-step-file', () => ({
  callStepFile: jest.fn().mockImplementation(async () => ({
    status: 200,
    body: { success: true },
  })),
}))

describe('File Upload Middleware', () => {
  const testUploadDir = path.join(os.tmpdir(), 'motia-file-test')
  let server: ReturnType<typeof createServer>

  beforeEach(() => {
    if (!fs.existsSync(testUploadDir)) fs.mkdirSync(testUploadDir, { recursive: true })

    const printer = new Printer(testUploadDir)
    const lockedData = {
      printer,
      activeSteps: [],
      eventSteps: () => [],
      cronSteps: () => [],
      onStep: () => {},
      applyStreamWrapper: () => {},
      createStream: () => () => new MemoryStreamAdapter(),
      on: () => {},
      getStreams: () => ({}),
    } as unknown as LockedData

    const eventManager = createEventManager()
    const state = new MemoryStateAdapter()
    const config = { isVerbose: false }

    server = createServer(lockedData, eventManager, state, config)
  })

  afterEach(async () => {
    if (server) await server.close()

    // Cleanup uploaded files and remove the folder itself
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true })
    }
  })

  it('should process file upload when fileUploadSchema is present', async () => {
    const step: Step<ApiRouteConfig> = {
      filePath: 'steps/upload-step.ts',
      version: '1.0.0',
      config: {
        type: 'api',
        name: 'upload-step',
        path: '/upload',
        method: 'POST',
        emits: [],
        fileUploadSchema: { destination: testUploadDir },
      },
    }

    server.addRoute(step)

    const dummyFile = path.join(testUploadDir, 'dummy.txt')
    fs.writeFileSync(dummyFile, 'dummy content')

    const response = await request(server.app)
      .post('/upload')
      .attach('myFile', dummyFile)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('should skip file processing when fileUploadSchema is missing', async () => {
    const step: Step<ApiRouteConfig> = {
      filePath: 'steps/no-upload-step.ts',
      version: '1.0.0',
      config: {
        type: 'api',
        name: 'no-upload-step',
        path: '/no-upload',
        method: 'POST',
        emits: [],
      },
    }

    server.addRoute(step)

    const dummyFile = path.join(testUploadDir, 'dummy2.txt')
    fs.writeFileSync(dummyFile, 'dummy content')

    const response = await request(server.app)
      .post('/no-upload')
      .attach('someFile', dummyFile)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
