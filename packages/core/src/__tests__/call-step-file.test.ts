import { randomUUID } from 'crypto'
import path from 'path'
import { callStepFile } from '../call-step-file'
import { createEventManager } from '../event-manager'
import { LockedData } from '../locked-data'
import { Logger } from '../logger'
import { LoggerFactory } from '../logger-factory'
import { Motia } from '../motia'
import { NoTracer, Tracer } from '../observability/tracer'
import { Printer } from '../printer'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { createCronStep } from './fixtures/step-fixtures'

describe('callStepFile', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  it('should call the cron step file with onlyContext true', async () => {
    const baseDir = path.join(__dirname, 'steps')
    const eventManager = createEventManager()
    const state = new MemoryStateAdapter()
    const step = createCronStep({ emits: ['TEST_EVENT'], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
    const printer = new Printer(baseDir)
    const traceId = randomUUID()
    const logger = new Logger()
    const tracer = new NoTracer()
    const motia: Motia = {
      eventManager,
      state,
      lockedData: new LockedData(baseDir),
      printer,
      loggerFactory: null as never as LoggerFactory,
      tracerFactory: { createTracer: () => tracer },
    }

    jest.spyOn(eventManager, 'emit').mockImplementation(() => Promise.resolve())

    await callStepFile(
      {
        step,
        traceId,
        logger,
        contextInFirstArg: true,
        tracer: null as never as Tracer,
      },
      motia,
    )

    expect(eventManager.emit).toHaveBeenCalledWith(
      {
        topic: 'TEST_EVENT',
        data: { test: 'data' },
        flows: ['motia-server'],
        traceId,
        logger: expect.any(Logger),
      },
      step.filePath,
    )
  })
})
