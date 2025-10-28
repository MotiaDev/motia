import { z } from 'zod'
import type { EventAdapter, SubscriptionHandle } from '../adapters/event-adapter'
import * as callStepFileModule from '../call-step-file'
import { globalLogger } from '../logger'
import type { Motia } from '../motia'
import { createStepHandlers } from '../step-handlers'
import type { EventConfig, Step } from '../types'

jest.mock('../logger', () => ({
  globalLogger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('../call-step-file', () => ({
  callStepFile: jest.fn(),
}))

describe('Step Handlers Infrastructure', () => {
  let mockEventAdapter: EventAdapter
  let mockSubscriptionHandle: SubscriptionHandle

  const mockMotia = {
    lockedData: {
      eventSteps: jest.fn(() => []),
    },
  } as unknown as Motia

  beforeEach(() => {
    jest.clearAllMocks()
    mockSubscriptionHandle = {
      topic: 'test.event',
      id: 'test-id',
      unsubscribe: jest.fn(async () => {}),
    }
    mockEventAdapter = {
      subscribe: jest.fn(
        async (topic: string, stepName: string, handler: any, options?: any) => mockSubscriptionHandle,
      ),
      unsubscribe: jest.fn(async () => {}),
      emit: jest.fn(async () => {}),
      shutdown: jest.fn(async () => {}),
      getSubscriptionCount: jest.fn(async () => 0),
      listTopics: jest.fn(async () => []),
    }
  })

  const createEventStep = (name: string, infrastructure?: EventConfig['infrastructure']): Step<EventConfig> => {
    return {
      filePath: `/test/steps/${name}.step.ts`,
      version: '1.0.0',
      config: {
        type: 'event',
        name,
        description: `Test step ${name}`,
        subscribes: ['test.event'],
        emits: [],
        input: z.object({ data: z.string() }),
        infrastructure,
      },
    }
  }

  describe('Step Registration with Valid Infrastructure', () => {
    it('should register step with valid infrastructure successfully', () => {
      const step = createEventStep('validStep', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard',
          maxRetries: 3,
          visibilityTimeout: 60,
        },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(mockEventAdapter.subscribe).toHaveBeenCalled()
      expect(globalLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[step handler] validating infrastructure config'),
        expect.any(Object),
      )
      expect(globalLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[step handler] infrastructure config validated successfully'),
        expect.any(Object),
      )
    })

    it('should register step without infrastructure successfully', () => {
      const step = createEventStep('noInfraStep')

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(mockEventAdapter.subscribe).toHaveBeenCalled()
      expect(globalLogger.error).not.toHaveBeenCalled()
    })

    it('should apply default queue config when no infrastructure provided', () => {
      const step = createEventStep('defaultConfigStep')

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(mockEventAdapter.subscribe).toHaveBeenCalledWith(
        'test.event',
        'defaultConfigStep',
        expect.any(Function),
        expect.objectContaining({
          type: 'standard',
          maxRetries: 3,
          visibilityTimeout: 900,
          delaySeconds: 0,
        }),
      )
    })

    it('should merge partial queue config with defaults', () => {
      const step = createEventStep('partialQueueStep', {
        queue: {
          maxRetries: 5,
          visibilityTimeout: 120,
        },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(mockEventAdapter.subscribe).toHaveBeenCalledWith(
        'test.event',
        'partialQueueStep',
        expect.any(Function),
        expect.objectContaining({
          type: 'standard',
          maxRetries: 5,
          visibilityTimeout: 120,
          delaySeconds: 0,
        }),
      )
    })

    it('should use custom queue config when fully specified', () => {
      const step = createEventStep('customQueueStep', {
        queue: {
          type: 'fifo',
          maxRetries: 10,
          visibilityTimeout: 60,
          delaySeconds: 5,
        },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(mockEventAdapter.subscribe).toHaveBeenCalledWith('test.event', 'customQueueStep', expect.any(Function), {
        type: 'fifo',
        maxRetries: 10,
        visibilityTimeout: 60,
        delaySeconds: 5,
      })
    })
  })

  describe('Step Registration with Invalid Infrastructure', () => {
    it('should not register step with invalid infrastructure', () => {
      const step = createEventStep('invalidStep', {
        handler: {
          ram: 64,
          timeout: 30,
        },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(globalLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('[step handler] Infrastructure configuration validation failed'),
        expect.objectContaining({
          step: 'invalidStep',
          errors: expect.any(Array),
        }),
      )
      expect(mockEventAdapter.subscribe).not.toHaveBeenCalled()
    })

    it('should not register step with invalid queue config', () => {
      const step = createEventStep('invalidQueueStep', {
        queue: {
          type: 'fifo',
          maxRetries: -1,
          visibilityTimeout: 60,
        },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(globalLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('[step handler] Infrastructure configuration validation failed'),
        expect.any(Object),
      )
      expect(mockEventAdapter.subscribe).not.toHaveBeenCalled()
    })

    it('should not register step with visibilityTimeout <= handler.timeout', () => {
      const step = createEventStep('invalidCrossFieldStep', {
        handler: {
          ram: 2048,
          timeout: 30,
        },
        queue: {
          type: 'standard',
          maxRetries: 3,
          visibilityTimeout: 30,
        },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(globalLogger.error).toHaveBeenCalled()
      expect(mockEventAdapter.subscribe).not.toHaveBeenCalled()
    })
  })

  describe('Multiple Steps Registration', () => {
    it('should register multiple steps with different infrastructure configs', () => {
      const step1 = createEventStep('step1', {
        handler: { ram: 1024, timeout: 15 },
        queue: { maxRetries: 3, visibilityTimeout: 60 },
      })
      const step2 = createEventStep('step2', {
        handler: { ram: 2048, timeout: 30 },
        queue: { maxRetries: 5, visibilityTimeout: 120 },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step1, step2])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(mockEventAdapter.subscribe).toHaveBeenCalledTimes(2)
    })

    it('should register valid steps and skip invalid ones', () => {
      const validStep = createEventStep('validStep', {
        handler: { ram: 2048, timeout: 30 },
      })
      const invalidStep = createEventStep('invalidStep', {
        handler: { ram: 64, timeout: 30 },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [validStep, invalidStep])

      createStepHandlers(mockMotia, mockEventAdapter)

      expect(mockEventAdapter.subscribe).toHaveBeenCalledTimes(1)
      expect(globalLogger.error).toHaveBeenCalledTimes(1)
    })
  })

  describe('Handler Execution', () => {
    it('should pass infrastructure config to callStepFile', async () => {
      const infrastructure: EventConfig['infrastructure'] = {
        handler: { ram: 2048, timeout: 30 },
        queue: { maxRetries: 3, visibilityTimeout: 60 },
      }
      const step = createEventStep('executionStep', infrastructure)

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      createStepHandlers(mockMotia, mockEventAdapter)

      const subscribedHandler = (mockEventAdapter.subscribe as jest.Mock).mock.calls[0][2]

      const mockEvent = {
        topic: 'test.event',
        data: { test: 'data' },
        traceId: 'test-trace',
        logger: { child: jest.fn(() => ({ child: jest.fn() })) },
        tracer: { child: jest.fn(() => ({})) },
      }

      await subscribedHandler(mockEvent)

      expect(callStepFileModule.callStepFile).toHaveBeenCalledWith(
        expect.objectContaining({
          step,
          infrastructure,
        }),
        mockMotia,
      )
    })
  })

  describe('Handler Removal', () => {
    it('should unsubscribe handler from event adapter on removeHandler', async () => {
      const step = createEventStep('removeStep', {
        handler: { ram: 2048, timeout: 30 },
      })

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      const manager = createStepHandlers(mockMotia, mockEventAdapter)

      await new Promise((resolve) => setImmediate(resolve))

      manager.removeHandler(step)

      expect(mockEventAdapter.unsubscribe).toHaveBeenCalledWith(mockSubscriptionHandle)
    })

    it('should handle removal of step with multiple subscriptions', async () => {
      const step: Step<EventConfig> = {
        filePath: '/test/steps/multiSub.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'multiSub',
          description: 'Multi subscription step',
          subscribes: ['event1', 'event2', 'event3'],
          emits: [],
          input: z.object({ data: z.string() }),
          infrastructure: {
            handler: { ram: 2048, timeout: 30 },
          },
        },
      }

      mockMotia.lockedData.eventSteps = jest.fn(() => [step])

      const manager = createStepHandlers(mockMotia, mockEventAdapter)

      await new Promise((resolve) => setImmediate(resolve))

      manager.removeHandler(step)

      expect(mockEventAdapter.unsubscribe).toHaveBeenCalledTimes(3)
    })

    it('should not throw when removing non-existent handler', () => {
      const step = createEventStep('nonExistent')

      mockMotia.lockedData.eventSteps = jest.fn(() => [])

      const manager = createStepHandlers(mockMotia, mockEventAdapter)

      expect(() => manager.removeHandler(step)).not.toThrow()
    })
  })
})
