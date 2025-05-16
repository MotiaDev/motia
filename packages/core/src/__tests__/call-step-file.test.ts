import { randomUUID } from 'crypto'
import path from 'path'
import { callStepFile } from '../call-step-file'
import { createEventManager } from '../event-manager'
import { BaseLogger } from '../logger'
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
    const logger = new BaseLogger()

    jest.spyOn(eventManager, 'emit').mockImplementation(() => Promise.resolve())

    await callStepFile({
      streamsConfig: {},
      step,
      eventManager,
      printer,
      state,
      traceId,
      logger,
      contextInFirstArg: true,
    })

    expect(eventManager.emit).toHaveBeenCalledWith(
      {
        topic: 'TEST_EVENT',
        data: { test: 'data' },
        flows: ['motia-server'],
        traceId,
        logger: expect.any(BaseLogger),
      },
      step.filePath,
    )
  })
})
