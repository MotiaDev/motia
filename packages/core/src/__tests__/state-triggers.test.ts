import { LockedData } from '../locked-data'
import { NoPrinter } from '../printer'
import { createStateHandlers } from '../state-trigger-handler'
import { hasStateTrigger, getTriggersByType } from '../guards'
import { Step, StateTrigger } from '../types'
import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
import { createEventManager } from '../event-manager'
import { BaseLoggerFactory } from '../logger-factory'
import { createTracerFactory } from '../observability/tracer'
import { MemoryStreamAdapter } from '../streams/adapters/memory-stream-adapter'

describe('State Triggers Functionality', () => {
  let lockedData: LockedData
  let stateAdapter: MemoryStateAdapter
  let motia: any
  let stateManager: any

  beforeEach(() => {
    lockedData = new LockedData(process.cwd(), 'memory', new NoPrinter())
    stateAdapter = new MemoryStateAdapter()
    
    // Create a minimal Motia object for testing
    const logStream = new MemoryStreamAdapter()
    motia = {
      lockedData,
      state: stateAdapter,
      loggerFactory: new BaseLoggerFactory(false, logStream),
      eventManager: createEventManager(),
      tracerFactory: createTracerFactory(lockedData),
    }
    
    // Clear any existing mocks
    jest.clearAllMocks()
    
    // Create a fresh state manager for each test
    stateManager = createStateHandlers(motia)
  })
  
  afterEach(() => {
    // Clear all state handlers between tests
    if (stateManager) {
      stateManager.clearAllHandlers()
    }
  })

  it('should correctly identify steps with state triggers', () => {
    const stateStep: Step = {
      filePath: '/path/to/state.step.ts',
      version: '1',
      config: {
        name: 'StateTriggerStep',
        triggers: [{
          type: 'state',
          key: 'user.status',
        }],
      },
    }

    const nonStateStep: Step = {
      filePath: '/path/to/event.step.ts',
      version: '1',
      config: {
        name: 'EventStep',
        triggers: [{
          type: 'event',
          topic: 'user.created',
        }],
      },
    }

    expect(hasStateTrigger(stateStep)).toBe(true)
    expect(hasStateTrigger(nonStateStep)).toBe(false)
  })

  it('should retrieve state triggers correctly', () => {
    const stateStep: Step = {
      filePath: '/path/to/state.step.ts',
      version: '1',
      config: {
        name: 'StateTriggerStep',
        triggers: [
          {
            type: 'state',
            key: 'user.status',
          },
          {
            type: 'state',
            key: 'user.score',
          },
        ],
      },
    }

    const stateTriggers = getTriggersByType(stateStep, 'state')
    expect(stateTriggers).toHaveLength(2)
    expect(stateTriggers[0].type).toBe('state')
    expect((stateTriggers[0] as StateTrigger).key).toBe('user.status')
    expect((stateTriggers[1] as StateTrigger).key).toBe('user.score')
  })

  it('should create and manage state handlers', () => {
    const stateStep: Step = {
      filePath: '/path/to/state.step.ts',
      version: '1',
      config: {
        name: 'StateTriggerStep',
        triggers: [{
          type: 'state',
          key: 'user.status',
        }],
      },
    }

    lockedData.createStep(stateStep, { disableTypeCreation: true })
    
    expect(lockedData.stepsWithStateTriggers()).toHaveLength(1)
    expect(lockedData.stepsWithStateTriggers()[0].config.name).toBe('StateTriggerStep')
  })

  it('should handle state changes and trigger steps', async () => {
    let triggeredStep: string | null = null
    let triggeredData: any = null

    // Mock the callStepFile function to capture triggers
    const originalCallStepFile = require('../call-step-file').callStepFile
    jest.spyOn(require('../call-step-file'), 'callStepFile').mockImplementation(async (options: any) => {
      triggeredStep = options.step.config.name
      triggeredData = options.data
    })

    const stateStep: Step = {
      filePath: '/path/to/state.step.ts',
      version: '1',
      config: {
        name: 'StateTriggerStep',
        triggers: [{
          type: 'state',
          key: 'user.status',
        }],
      },
    }

    lockedData.createStep(stateStep, { disableTypeCreation: true })
    
    // Register the step with the state manager
    stateManager.createStateHandler(stateStep)
    
    // Simulate a state change
    await stateAdapter.set('test-trace', 'user.status', 'active')
    
    // The state wrapper should have triggered the state change callback
    // Since we can't easily test the wrapper integration here, we'll test the handler directly
    await stateManager.checkStateTriggers('test-trace', 'user.status', 'active')
    
    expect(triggeredStep).toBe('StateTriggerStep')
    expect(triggeredData).toEqual({
      key: 'user.status',
      value: 'active',
      traceId: 'test-trace',
      depth: 0,
    })

    // Restore the original function
    jest.restoreAllMocks()
  })

  it('should handle state triggers with conditions', async () => {
    let triggeredStep: string | null = null

    // Mock the callStepFile function
    jest.spyOn(require('../call-step-file'), 'callStepFile').mockImplementation(async (options: any) => {
      triggeredStep = options.step.config.name
    })

    const stateStep: Step = {
      filePath: '/path/to/conditional-state.step.ts',
      version: '1',
      config: {
        name: 'ConditionalStateStep',
        triggers: [{
          type: 'state',
          key: 'user.score',
          condition: (value: any) => value > 100, // Only trigger if score > 100
        }],
      },
    }

    lockedData.createStep(stateStep, { disableTypeCreation: true })
    
    // Register the step with the state manager
    stateManager.createStateHandler(stateStep)
    
    // Test with value that should trigger
    await stateManager.checkStateTriggers('test-trace', 'user.score', 150)
    expect(triggeredStep).toBe('ConditionalStateStep')
    
    // Reset
    triggeredStep = null
    
    // Test with value that should NOT trigger
    await stateManager.checkStateTriggers('test-trace', 'user.score', 50)
    expect(triggeredStep).toBeNull()

    jest.restoreAllMocks()
  })

  it('should handle multiple steps watching the same state key', async () => {
    const triggeredSteps: string[] = []

    // Mock the callStepFile function
    jest.spyOn(require('../call-step-file'), 'callStepFile').mockImplementation(async (options: any) => {
      triggeredSteps.push(options.step.config.name)
    })

    const stateStep1: Step = {
      filePath: '/path/to/state1.step.ts',
      version: '1',
      config: {
        name: 'StateStep1',
        triggers: [{
          type: 'state',
          key: 'user.status',
        }],
      },
    }

    const stateStep2: Step = {
      filePath: '/path/to/state2.step.ts',
      version: '1',
      config: {
        name: 'StateStep2',
        triggers: [{
          type: 'state',
          key: 'user.status',
        }],
      },
    }

    lockedData.createStep(stateStep1, { disableTypeCreation: true })
    lockedData.createStep(stateStep2, { disableTypeCreation: true })
    
    // Register both steps with the state manager
    stateManager.createStateHandler(stateStep1)
    stateManager.createStateHandler(stateStep2)
    
    // Both steps should be triggered by the same state change
    await stateManager.checkStateTriggers('test-trace', 'user.status', 'active')
    
    expect(triggeredSteps).toHaveLength(2)
    expect(triggeredSteps).toContain('StateStep1')
    expect(triggeredSteps).toContain('StateStep2')

    jest.restoreAllMocks()
  })

  it('should handle state trigger removal', () => {
    const stateStep: Step = {
      filePath: '/path/to/state.step.ts',
      version: '1',
      config: {
        name: 'StateTriggerStep',
        triggers: [{
          type: 'state',
          key: 'user.status',
        }],
      },
    }

    lockedData.createStep(stateStep, { disableTypeCreation: true })
    
    expect(lockedData.stepsWithStateTriggers()).toHaveLength(1)
    
    // Remove the step
    stateManager.removeStateHandler(stateStep)
    
    // The step should still exist in lockedData, but the state handler should be removed
    expect(lockedData.stepsWithStateTriggers()).toHaveLength(1) // Still in lockedData
  })
})
