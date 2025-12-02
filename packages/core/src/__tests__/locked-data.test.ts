import path from 'path'
import { MemoryStreamAdapterManager } from '../adapters/defaults'
import { LockedData } from '../locked-data'
import { NoPrinter } from '../printer'
import { createApiStep, createCronStep, createEventStep, createNoopStep } from './fixtures/step-fixtures'
import { createMockRedisClient } from './test-helpers/redis-client'

describe('LockedData', () => {
  describe('step creation', () => {
    it('should add steps to activeSteps when created', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const step = createApiStep()
      lockedData.createStep(step, { disableTypeCreation: true })

      expect(lockedData.activeSteps).toHaveLength(1)
      expect(lockedData.activeSteps).toEqual([step])
    })

    it('should add steps to devSteps when virtualEmits is present', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const step = createNoopStep()

      lockedData.createStep(step, { disableTypeCreation: true })

      expect(lockedData.devSteps).toHaveLength(1)
      expect(lockedData.activeSteps).toHaveLength(0)
      expect(lockedData.devSteps).toEqual([step])
    })

    it('should create flows when they do not exist', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const step = createApiStep({ name: 'Test 1', flows: ['flow1', 'flow2'] })

      lockedData.createStep(step, { disableTypeCreation: true })

      expect(Object.keys(lockedData.flows)).toHaveLength(2)
      expect(lockedData.flows['flow1'].steps).toContain(step)
      expect(lockedData.flows['flow2'].steps).toContain(step)
    })

    it('should trigger event handlers when step is created', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const handler = jest.fn()
      const step = createApiStep()

      lockedData.onStep('step-created', handler)
      lockedData.createStep(step, { disableTypeCreation: true })

      expect(handler).toHaveBeenCalledWith(step)
    })
  })

  describe('step filtering', () => {
    let lockedData: LockedData

    const apiStep = createApiStep()
    const eventStep = createEventStep()
    const cronStep = createCronStep()

    beforeAll(() => {
      lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      lockedData.createStep(apiStep, { disableTypeCreation: true })
      lockedData.createStep(eventStep, { disableTypeCreation: true })
      lockedData.createStep(cronStep, { disableTypeCreation: true })
    })

    it('should filter api steps correctly', () => {
      const apiSteps = lockedData.apiSteps()
      expect(apiSteps).toHaveLength(1)
      expect(apiSteps).toEqual([apiStep])
    })

    it('should filter event steps correctly', () => {
      const eventSteps = lockedData.eventSteps()
      expect(eventSteps).toHaveLength(1)
      expect(eventSteps).toEqual([eventStep])
    })

    it('should filter cron steps correctly', () => {
      const cronSteps = lockedData.cronSteps()
      expect(cronSteps).toHaveLength(1)
      expect(cronSteps).toEqual([cronStep])
    })
  })

  describe('step changes', () => {
    it('should handle flow changes correctly', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const oldStep = createApiStep({ flows: ['flow-1', 'flow-2'] })
      lockedData.createStep(oldStep, { disableTypeCreation: true })

      expect(Object.keys(lockedData.flows)).toEqual(['flow-1', 'flow-2'])

      const newStep = createApiStep({ ...oldStep.config, flows: ['flow-2', 'flow-3'] })
      lockedData.updateStep(oldStep, newStep, { disableTypeCreation: true })

      expect(Object.keys(lockedData.flows)).toEqual(['flow-2', 'flow-3'])

      expect(lockedData.flows['flow-1']).toBeUndefined()
      expect(lockedData.flows['flow-2'].steps).toContainEqual(newStep)
      expect(lockedData.flows['flow-3'].steps).toContainEqual(newStep)
    })

    it('should handle type changes correctly', () => {
      const baseDir = '/test/dir'
      const lockedData = new LockedData(
        baseDir,
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const filePath = path.join(baseDir, 'steps/flow-1/step.ts')
      const oldStep = createApiStep({}, filePath)
      lockedData.createStep(oldStep, { disableTypeCreation: true })

      const newStep = createEventStep({}, filePath)
      lockedData.updateStep(oldStep, newStep, { disableTypeCreation: true })

      expect(lockedData.apiSteps()).toHaveLength(0)
      expect(lockedData.eventSteps()).toHaveLength(1)
    })

    it('should trigger event handlers when step is updated', () => {
      const baseDir = '/test/dir'
      const handler = jest.fn()
      const lockedData = new LockedData(
        baseDir,
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const filePath = path.join(baseDir, 'steps/flow-1/step.ts')
      const oldStep = createApiStep({}, filePath)
      lockedData.createStep(oldStep, { disableTypeCreation: true })

      const newStep = createEventStep({}, filePath)
      lockedData.updateStep(oldStep, newStep, { disableTypeCreation: true })

      lockedData.onStep('step-updated', handler)
      lockedData.updateStep(oldStep, newStep, { disableTypeCreation: true })

      expect(handler).toHaveBeenCalledWith(newStep)
    })
  })

  describe('step deletion', () => {
    it('should remove steps from activeSteps and flows', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const step = createApiStep({ flows: ['flow-1'] })

      lockedData.createStep(step, { disableTypeCreation: true })

      expect(Object.keys(lockedData.flows)).toEqual(['flow-1'])

      lockedData.deleteStep(step, { disableTypeCreation: true })

      expect(lockedData.activeSteps).toHaveLength(0)
      expect(lockedData.flows['flow-1']).toBeUndefined()
      expect(Object.keys(lockedData.flows)).toHaveLength(0)
    })

    it('should remove steps from devSteps', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const step = createNoopStep()

      lockedData.createStep(step, { disableTypeCreation: true })
      expect(lockedData.devSteps).toHaveLength(1)

      lockedData.deleteStep(step, { disableTypeCreation: true })
      expect(lockedData.devSteps).toHaveLength(0)
    })

    it('should keep flows with remaining steps', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )

      const step1 = createApiStep({ flows: ['flow-1'] })
      const step2 = createEventStep({ flows: ['flow-1'] })

      lockedData.createStep(step1, { disableTypeCreation: true })
      lockedData.createStep(step2, { disableTypeCreation: true })

      expect(Object.keys(lockedData.flows)).toEqual(['flow-1'])

      lockedData.deleteStep(step1, { disableTypeCreation: true })

      expect(Object.keys(lockedData.flows)).toEqual(['flow-1'])
    })

    it('should trigger event handlers when step is deleted', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const handler = jest.fn()
      const step = createApiStep()

      lockedData.createStep(step, { disableTypeCreation: true })
      lockedData.onStep('step-removed', handler)
      lockedData.deleteStep(step, { disableTypeCreation: true })

      expect(handler).toHaveBeenCalledWith(step)
    })
  })

  describe('flow events', () => {
    it('should call handlers when flow is created', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const handler = jest.fn()

      lockedData.on('flow-created', handler)
      lockedData.createStep(createApiStep({ flows: ['flow-1'] }), { disableTypeCreation: true })

      expect(handler).toHaveBeenCalledWith('flow-1')
    })

    it('should call handlers when flow is removed', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const handler = jest.fn()
      const step = createApiStep({ flows: ['flow-1'] })

      lockedData.on('flow-removed', handler)

      lockedData.createStep(step, { disableTypeCreation: true })
      lockedData.deleteStep(step, { disableTypeCreation: true })

      expect(handler).toHaveBeenCalledWith('flow-1')
    })

    it('should call updated handlers when new step is added to flow', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const handler = jest.fn()

      lockedData.on('flow-updated', handler)
      lockedData.createStep(createApiStep({ flows: ['flow-1'] }), { disableTypeCreation: true })
      expect(handler).not.toHaveBeenCalled()

      lockedData.createStep(createEventStep({ flows: ['flow-1'] }), { disableTypeCreation: true })
      expect(handler).toHaveBeenCalledWith('flow-1')
    })

    it('should call handlers when step is removed from flow', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const updateHandler = jest.fn()
      const event = createEventStep({ flows: ['flow-1'] })

      lockedData.createStep(createApiStep({ flows: ['flow-1'] }), { disableTypeCreation: true })
      lockedData.createStep(event, { disableTypeCreation: true })

      // only after second step is added
      lockedData.on('flow-updated', updateHandler)
      expect(updateHandler).not.toHaveBeenCalled()

      lockedData.deleteStep(event, { disableTypeCreation: true })
      expect(updateHandler).toHaveBeenCalledWith('flow-1')
    })

    it('should not call removed handlers when step is removed from flow but flow is not empty', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const deleteHandler = jest.fn()
      const event = createEventStep({ flows: ['flow-1'] })

      lockedData.on('flow-removed', deleteHandler)

      lockedData.createStep(createApiStep({ flows: ['flow-1'] }), { disableTypeCreation: true })
      lockedData.createStep(event, { disableTypeCreation: true })
      expect(deleteHandler).not.toHaveBeenCalled()

      lockedData.deleteStep(event, { disableTypeCreation: true })
      expect(deleteHandler).not.toHaveBeenCalled()
    })

    it('should call handlers when step is updated inside a flow', () => {
      const lockedData = new LockedData(
        process.cwd(),
        new MemoryStreamAdapterManager(),
        new NoPrinter(),
        createMockRedisClient(),
      )
      const updateHandler = jest.fn()
      const event = createEventStep({ flows: ['flow-1'] })

      lockedData.on('flow-updated', updateHandler)
      lockedData.createStep(event, { disableTypeCreation: true })
      expect(updateHandler).not.toHaveBeenCalled()

      lockedData.updateStep(event, createEventStep({ ...event.config, name: 'new-name' }), {
        disableTypeCreation: true,
      })
      expect(updateHandler).toHaveBeenCalledWith('flow-1')
    })
  })
})
