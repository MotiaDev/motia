import { spawnSync } from 'child_process'
import { randomUUID } from 'crypto'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { callStepFile } from '../call-step-file'
import { createEventManager } from '../event-manager'
import { LockedData } from '../locked-data'
import { Logger } from '../logger'
import type { Motia } from '../motia'
import { NoTracer } from '../observability/no-tracer'
import { NoPrinter } from '../printer'
import { QueueManager } from '../queue-manager'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { createApiStep } from './fixtures/step-fixtures'

describe('callStepFile (large payload via temp file) - Python', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  const hasPython = spawnSync('python', ['-V']).status === 0
  const itif = hasPython ? it : it.skip

  itif(
    'handles >1MB payload using meta file and cleans up temp dir',
    async () => {
      const baseDir = path.join(__dirname, 'steps')
      const queueManager = new QueueManager()
      const eventManager = createEventManager(queueManager)
      const state = new MemoryStateAdapter()

      const step = createApiStep({ emits: [] }, path.join(baseDir, 'large-data-step.py'))
      const printer = new NoPrinter()
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()

      const motia: Motia = {
        eventManager,
        state,
        printer,
        queueManager,
        lockedData: new LockedData(baseDir, 'memory', printer),
        loggerFactory: { create: () => logger },
        tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
        app: express(),
        stateAdapter: state,
      }

      const bigData = 'x'.repeat(2 * 1024 * 1024)

      let metaPath: string | undefined
      const originalWrite = fs.writeFileSync
      const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((file: any, data: any, options?: any) => {
        if (typeof file === 'string' && file.endsWith(path.join('meta.json'))) {
          metaPath = file
        }
        return (originalWrite as any).call(fs, file, data, options)
      })

      await callStepFile<number>({ step, traceId, data: bigData, logger, tracer }, motia)

      if (metaPath) {
        expect(fs.existsSync(metaPath)).toBe(false)
      }

      writeSpy.mockRestore()
    },
    30000,
  )
})
