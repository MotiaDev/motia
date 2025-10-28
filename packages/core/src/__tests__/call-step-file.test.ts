import { randomUUID } from 'crypto'
import express from 'express'
import path from 'path'
import { InMemoryQueueEventAdapter } from '../adapters/defaults/event/in-memory-queue-event-adapter'
import { MemoryStateAdapter } from '../adapters/defaults/state/memory-state-adapter'
import { callStepFile } from '../call-step-file'
import { LockedData } from '../locked-data'
import { Logger } from '../logger'
import type { Motia } from '../motia'
import { NoTracer } from '../observability/no-tracer'
import { NoPrinter } from '../printer'
import type { InfrastructureConfig } from '../types'
import { createCronStep, createEventStep } from './fixtures/step-fixtures'

describe('callStepFile', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  const createMockMotia = (baseDir: string): Motia => {
    const eventAdapter = new InMemoryQueueEventAdapter()
    const state = new MemoryStateAdapter()
    const printer = new NoPrinter()

    return {
      eventAdapter,
      state,
      printer,
      lockedData: new LockedData(baseDir, 'memory', printer),
      loggerFactory: { create: () => new Logger() },
      tracerFactory: {
        createTracer: () => new NoTracer(),
        attachToTrace: () => new NoTracer(),
        clear: () => Promise.resolve(),
      },
      app: express(),
      stateAdapter: state,
    }
  }

  it('should call the cron step file with onlyContext true', async () => {
    const baseDir = path.join(__dirname, 'steps')
    const step = createCronStep({ emits: ['TEST_EVENT'], cron: '* * * * *' }, path.join(baseDir, 'cron-step-emit.ts'))
    const traceId = randomUUID()
    const logger = new Logger()
    const tracer = new NoTracer()
    const motia = createMockMotia(baseDir)

    jest.spyOn(motia.eventAdapter, 'emit').mockImplementation(() => Promise.resolve())

    await callStepFile({ step, traceId, logger, contextInFirstArg: true, tracer }, motia)

    expect(motia.eventAdapter.emit).toHaveBeenCalledWith({
      topic: 'TEST_EVENT',
      data: { test: 'data' },
      flows: ['motia-server'],
      traceId,
      logger: expect.anything(),
      tracer: expect.anything(),
    })
  })

  describe('Timeout Functionality', () => {
    it('should not timeout when no timeout is configured', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      await expect(callStepFile({ step, traceId, logger, tracer }, motia)).resolves.not.toThrow()
    })

    it('should not timeout when execution completes within timeout', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 30,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).resolves.not.toThrow()
    })

    it('should timeout when execution exceeds configured timeout', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createEventStep({ subscribes: ['test'], emits: [] }, path.join(baseDir, 'long-running-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      jest.spyOn(logger, 'error')

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 1,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).rejects.toThrow(
        'Step execution timed out after 1 seconds',
      )

      expect(logger.error).toHaveBeenCalledWith(
        'Step execution timed out after 1 seconds',
        expect.objectContaining({
          step: step.config.name,
          timeout: 1,
        }),
      )
    }, 10000)

    it('should clear timeout after successful execution', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 30,
        },
      }

      await callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should clear timeout after process error', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createEventStep({ subscribes: ['test'], emits: [] }, path.join(baseDir, 'nonexistent-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 30,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).rejects.toBeDefined()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle infrastructure object without handler', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {
        queue: {
          maxRetries: 5,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).resolves.not.toThrow()
    })

    it('should handle infrastructure.handler without timeout', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {
        handler: {
          ram: 2048,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).resolves.not.toThrow()
    })

    it('should handle empty infrastructure object', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {}

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).resolves.not.toThrow()
    })

    it('should accept timeout: 0 configuration', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 0,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).resolves.not.toThrow()
    }, 10000)

    it('should handle very large timeout value', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 86400,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).resolves.not.toThrow()
    })

    it('should handle multiple concurrent calls with timeout', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 30,
        },
      }

      const calls = Array.from({ length: 3 }, () =>
        callStepFile({ step, traceId: randomUUID(), logger, tracer, infrastructure }, motia),
      )

      await expect(Promise.all(calls)).resolves.not.toThrow()
    })

    it('should handle fractional timeout value', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createCronStep({ emits: [], cron: '* * * * *' }, path.join(baseDir, 'cron-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 30.5,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).resolves.not.toThrow()
    })

    it('should clear timeout when process spawn fails', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createEventStep({ subscribes: ['test'], emits: [] }, path.join(baseDir, 'nonexistent-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 30,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).rejects.toBeDefined()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should track timeout event analytics', async () => {
      const baseDir = path.join(__dirname, 'steps')
      const step = createEventStep({ subscribes: ['test'], emits: [] }, path.join(baseDir, 'long-running-step.ts'))
      const traceId = randomUUID()
      const logger = new Logger()
      const tracer = new NoTracer()
      const motia = createMockMotia(baseDir)

      jest.spyOn(tracer, 'end')

      const infrastructure: InfrastructureConfig = {
        handler: {
          timeout: 1,
        },
      }

      await expect(callStepFile({ step, traceId, logger, tracer, infrastructure }, motia)).rejects.toThrow()

      expect(tracer.end).toHaveBeenCalledWith({
        message: 'Step execution timed out after 1 seconds',
      })
    }, 10000)
  })
})
