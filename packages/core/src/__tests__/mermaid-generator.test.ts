import fs from 'fs'
import path from 'path'
import { createMermaidGenerator } from '../mermaid-generator'
import { createApiStep, createEventStep, createNoopStep } from './fixtures/step-fixtures'
import { LockedData } from '../locked-data'
import { NoPrinter } from '../printer'

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}))

describe('Mermaid Generator', () => {
  const baseDir = '/test/dir'
  const diagramsDir = path.join(baseDir, '.mermaid')

  beforeEach(() => {
    jest.clearAllMocks()
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)
  })

  describe('createMermaidGenerator', () => {
    it('should create diagrams directory if it does not exist', () => {
      ;(fs.existsSync as jest.Mock).mockReturnValue(false)
      createMermaidGenerator(baseDir)
      expect(fs.mkdirSync).toHaveBeenCalledWith(diagramsDir, { recursive: true })
    })

    it('should not create diagrams directory if it already exists', () => {
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      createMermaidGenerator(baseDir)
      expect(fs.mkdirSync).not.toHaveBeenCalled()
    })

    it('should return an object with initialize method', () => {
      const generator = createMermaidGenerator(baseDir)
      expect(generator).toHaveProperty('initialize')
      expect(typeof generator.initialize).toBe('function')
    })
  })

  describe('initialize', () => {
    let lockedData: LockedData
    let generator: ReturnType<typeof createMermaidGenerator>

    beforeEach(() => {
      lockedData = new LockedData(baseDir, 'memory', new NoPrinter())
      generator = createMermaidGenerator(baseDir)

      // Mock the on method of lockedData
      lockedData.on = jest.fn()
    })

    it('should register event handlers with lockedData', () => {
      generator.initialize(lockedData)
      expect(lockedData.on).toHaveBeenCalledWith('flow-created', expect.any(Function))
      expect(lockedData.on).toHaveBeenCalledWith('flow-updated', expect.any(Function))
      expect(lockedData.on).toHaveBeenCalledWith('flow-removed', expect.any(Function))
    })

    it('should generate diagrams for existing flows', () => {
      // Create a mock flow
      const apiStep = createApiStep({ flows: ['flow-1'] }, path.join(baseDir, 'steps/flow-1/api.step.ts'))
      const eventStep = createEventStep({ flows: ['flow-1'] }, path.join(baseDir, 'steps/flow-1/event.step.ts'))

      // Add steps to the flow
      lockedData.flows = {
        'flow-1': {
          name: 'flow-1',
          description: 'Test flow',
          steps: [apiStep, eventStep],
        },
      }

      generator.initialize(lockedData)
      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(diagramsDir, 'flow-1.mmd'), expect.any(String))
    })
  })

  describe('event handlers', () => {
    let lockedData: LockedData
    let generator: ReturnType<typeof createMermaidGenerator>
    let flowCreatedHandler: (flowName: string) => void
    let flowUpdatedHandler: (flowName: string) => void
    let flowRemovedHandler: (flowName: string) => void

    beforeEach(() => {
      lockedData = new LockedData(baseDir, 'memory', new NoPrinter())
      generator = createMermaidGenerator(baseDir)

      // Mock the on method of lockedData to capture the handlers
      lockedData.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'flow-created') flowCreatedHandler = handler
        if (event === 'flow-updated') flowUpdatedHandler = handler
        if (event === 'flow-removed') flowRemovedHandler = handler
      })

      generator.initialize(lockedData)
    })

    it('should generate diagram when flow is created', () => {
      // Create a mock flow
      const apiStep = createApiStep({ flows: ['flow-1'] }, path.join(baseDir, 'steps/flow-1/api.step.ts'))

      // Add step to the flow
      lockedData.flows = {
        'flow-1': {
          name: 'flow-1',
          description: 'Test flow',
          steps: [apiStep],
        },
      }

      // Call the flow-created handler
      flowCreatedHandler('flow-1')

      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(diagramsDir, 'flow-1.mmd'), expect.any(String))
    })

    it('should update diagram when flow is updated', () => {
      // Create a mock flow
      const apiStep = createApiStep({ flows: ['flow-1'] }, path.join(baseDir, 'steps/flow-1/api.step.ts'))

      // Add step to the flow
      lockedData.flows = {
        'flow-1': {
          name: 'flow-1',
          description: 'Test flow',
          steps: [apiStep],
        },
      }

      // Call the flow-updated handler
      flowUpdatedHandler('flow-1')

      expect(fs.writeFileSync).toHaveBeenCalledWith(path.join(diagramsDir, 'flow-1.mmd'), expect.any(String))
    })

    it('should remove diagram when flow is removed', () => {
      // Call the flow-removed handler
      flowRemovedHandler('flow-1')

      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(diagramsDir, 'flow-1.mmd'))
    })
  })

  describe('diagram generation', () => {
    it('should generate a valid mermaid diagram for a flow with multiple steps', () => {
      // Create mock steps
      const apiStep = createApiStep(
        {
          flows: ['flow-1'],
          emits: ['event.topic'],
        },
        path.join(baseDir, 'steps/flow-1/api.step.ts'),
      )

      const eventStep = createEventStep(
        {
          flows: ['flow-1'],
          triggers: [{
            type: 'event',
            topic: 'event.topic',
          }],
          emits: ['event.processed'],
        },
        path.join(baseDir, 'steps/flow-1/event.step.ts'),
      )

      const noopStep = createNoopStep(
        {
          flows: ['flow-1'],
          virtualSubscribes: ['event.processed'],
        },
        path.join(baseDir, 'steps/flow-1/noop.step.ts'),
      )

      // Create a mock flow
      const flow = {
        name: 'flow-1',
        description: 'Test flow',
        steps: [apiStep, eventStep, noopStep],
      }

      // Create a mock LockedData instance
      const lockedData = new LockedData(baseDir, 'memory', new NoPrinter())
      lockedData.flows = { 'flow-1': flow }

      // Generate the diagram
      const generator = createMermaidGenerator(baseDir)

      // Use a spy to capture the diagram content
      const writeFileSpy = jest.spyOn(fs, 'writeFileSync')

      // Mock the on method to capture the handler directly
      let flowCreatedHandler: ((flowName: string) => void) | undefined
      lockedData.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'flow-created') flowCreatedHandler = handler
      })

      // Initialize the generator with the mock LockedData
      generator.initialize(lockedData)

      // Trigger the flow-created event handler
      if (!flowCreatedHandler) {
        throw new Error('flowCreatedHandler was not captured')
      }
      flowCreatedHandler('flow-1')

      // Get the diagram content from the spy
      const diagramContent = writeFileSpy.mock.calls[0][1] as string

      // Verify the diagram content
      expect(diagramContent).toContain('flowchart TD')
      expect(diagramContent).toContain('classDef apiStyle')
      expect(diagramContent).toContain('classDef eventStyle')
      expect(diagramContent).toContain('classDef noopStyle')

      // Verify node definitions are present (without checking exact IDs since they're generated internally)
      expect(diagramContent).toContain('["🌐 Start Event"]:::apiStyle')
      expect(diagramContent).toContain('["⚡ Processor"]:::eventStyle')
      expect(diagramContent).toContain('["⚙️ Noop"]:::noopStyle')

      // Verify connections are present (without checking exact IDs)
      expect(diagramContent).toContain('-->|event.topic|')
      expect(diagramContent).toContain('-->|event.processed|')
    })

    it('should handle empty flows', () => {
      // Create a mock empty flow
      const flow = {
        name: 'empty-flow',
        description: 'Empty flow',
        steps: [],
      }

      // Create a mock LockedData instance
      const lockedData = new LockedData(baseDir, 'memory', new NoPrinter())
      lockedData.flows = { 'empty-flow': flow }

      // Generate the diagram
      const generator = createMermaidGenerator(baseDir)

      // Use a spy to capture the diagram content
      const writeFileSpy = jest.spyOn(fs, 'writeFileSync')

      // Mock the on method to capture the handler directly
      let flowCreatedHandler: ((flowName: string) => void) | undefined
      lockedData.on = jest.fn().mockImplementation((event, handler) => {
        if (event === 'flow-created') flowCreatedHandler = handler
      })

      // Initialize the generator with the mock LockedData
      generator.initialize(lockedData)

      // Trigger the flow-created event handler
      if (!flowCreatedHandler) {
        throw new Error('flowCreatedHandler was not captured')
      }
      flowCreatedHandler('empty-flow')

      // Get the diagram content from the spy
      const diagramContent = writeFileSpy.mock.calls[0][1] as string

      // Verify the diagram content
      expect(diagramContent).toContain('flowchart TD')
      expect(diagramContent).toContain('empty[No steps in this flow]')
    })
  })
})
