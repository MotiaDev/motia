import { jest } from '@jest/globals'
import type { Printer } from '../../printer'
import type { EventConfig, Step } from '../../types'
import { generateTypesFromSteps } from '../../types/generate-types'

describe('generateTypesFromSteps - messageGroupId', () => {
  const mockPrinter: Printer = {
    printInvalidSchema: jest.fn(),
    printInvalidEmitConfiguration: jest.fn(),
  } as any

  it('should include required messageGroupId for FIFO queue topics', () => {
    const steps: Step[] = [
      {
        filePath: '/test/consumer.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'consumer',
          subscribes: ['test.topic'],
          emits: [],
          input: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
          infrastructure: {
            queue: {
              type: 'fifo',
            },
          },
        } as unknown as EventConfig,
      },
      {
        filePath: '/test/producer.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'producer',
          subscribes: ['other.topic'],
          emits: ['test.topic'],
          input: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        } as unknown as EventConfig,
      },
    ]

    const handlers = generateTypesFromSteps(steps, mockPrinter)

    expect(handlers.producer.generics[1]).toContain('messageGroupId: string')
    expect(handlers.producer.generics[1]).not.toContain('messageGroupId?: string')
  })

  it('should not include messageGroupId for standard queue topics', () => {
    const steps: Step[] = [
      {
        filePath: '/test/consumer.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'consumer',
          subscribes: ['test.topic'],
          emits: [],
          input: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
          infrastructure: {
            queue: {
              type: 'standard',
            },
          },
        } as unknown as EventConfig,
      },
      {
        filePath: '/test/producer.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'producer',
          subscribes: ['other.topic'],
          emits: ['test.topic'],
          input: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        } as unknown as EventConfig,
      },
    ]

    const handlers = generateTypesFromSteps(steps, mockPrinter)

    expect(handlers.producer.generics[1]).not.toContain('messageGroupId')
  })

  it('should include messageGroupId when at least one consumer has FIFO queue', () => {
    const steps: Step[] = [
      {
        filePath: '/test/consumer1.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'consumer1',
          subscribes: ['test.topic'],
          emits: [],
          input: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
          infrastructure: {
            queue: {
              type: 'standard',
            },
          },
        } as unknown as EventConfig,
      },
      {
        filePath: '/test/consumer2.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'consumer2',
          subscribes: ['test.topic'],
          emits: [],
          input: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
          infrastructure: {
            queue: {
              type: 'fifo',
            },
          },
        } as unknown as EventConfig,
      },
      {
        filePath: '/test/producer.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'producer',
          subscribes: ['other.topic'],
          emits: ['test.topic'],
          input: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        } as unknown as EventConfig,
      },
    ]

    const handlers = generateTypesFromSteps(steps, mockPrinter)

    expect(handlers.producer.generics[1]).toContain('messageGroupId: string')
  })

  it('should not include messageGroupId when no infrastructure config is provided', () => {
    const steps: Step[] = [
      {
        filePath: '/test/consumer.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'consumer',
          subscribes: ['test.topic'],
          emits: [],
          input: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
        } as unknown as EventConfig,
      },
      {
        filePath: '/test/producer.step.ts',
        version: '1.0.0',
        config: {
          type: 'event',
          name: 'producer',
          subscribes: ['other.topic'],
          emits: ['test.topic'],
          input: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        } as unknown as EventConfig,
      },
    ]

    const handlers = generateTypesFromSteps(steps, mockPrinter)

    expect(handlers.producer.generics[1]).not.toContain('messageGroupId')
  })
})
