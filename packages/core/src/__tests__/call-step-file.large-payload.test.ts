import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import { callStepFile } from '../call-step-file'
import { createEventManager } from '../event-manager'
import { LockedData } from '../locked-data'
import { Logger } from '../logger'
import { Motia } from '../motia'
import { NoPrinter } from '../printer'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { createApiStep } from './fixtures/step-fixtures'
import { NoTracer } from '../observability/no-tracer'
import express from 'express'

describe('callStepFile (large payload via temp file)', () => {
  beforeAll(() => {
    // Ensure node-runner.ts is used (ts-node/register)
    process.env._MOTIA_TEST_MODE = 'true'
  })

  it('handles >1MB payload using meta file and cleans up temp dir', async () => {
    const baseDir = path.join(__dirname, 'steps')
    const eventManager = createEventManager()
    const state = new MemoryStateAdapter()

    const step = createApiStep({ emits: [] }, path.join(baseDir, 'large-data-step.ts'))
    const printer = new NoPrinter()
    const traceId = randomUUID()
    const logger = new Logger()
    const tracer = new NoTracer()

    const motia: Motia = {
      eventManager,
      state,
      printer,
      lockedData: new LockedData(baseDir, 'memory', printer),
      loggerFactory: { create: () => logger },
      tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
      app: express(),
      stateAdapter: state
    }

    // Prepare a ~2MB string to exceed the 1MB threshold
    const bigData = 'x'.repeat(2 * 1024 * 1024)

    // Capture meta.json path to verify cleanup of its parent dir
    let metaPath: string | undefined
    const originalWrite = fs.writeFileSync
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((file: any, data: any, options?: any) => {
      if (typeof file === 'string' && file.endsWith(path.join('meta.json'))) {
        metaPath = file
      }
      // call through to original implementation captured before spy
      return (originalWrite as any).call(fs, file, data, options)
    })

    // Act: call the step file and expect the handler to return the string length
    const result = await callStepFile<number>({ step, traceId, data: bigData, logger, tracer }, motia)

    // Assert: handler received the data by reading meta.json, returning its length
    expect(result).toBe(bigData.length)

    // Assert: temp directory (parent of meta.json) is cleaned up
    if (metaPath) {
      const dir = path.dirname(metaPath)
      expect(fs.existsSync(dir)).toBe(false)
    }

    writeSpy.mockRestore()
  }, 30000)
})
