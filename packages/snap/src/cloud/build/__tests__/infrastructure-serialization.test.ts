import { BuildStepConfig, StepsConfigFile } from '../builder'
import { z } from '@motiadev/core/node_modules/zod'

describe('Infrastructure Config Serialization', () => {
  function createMockStepWithInfrastructure(): BuildStepConfig {
    const inputSchema = z.object({
      traceId: z.string(),
      userId: z.string(),
    })

    return {
      type: 'node',
      entrypointPath: '/mock/steps/testStep.step.ts',
      filePath: '/mock/project/steps/testStep.step.ts',
      config: {
        type: 'event',
        name: 'testStep',
        description: 'Test step with infrastructure',
        subscribes: ['test.event'],
        emits: [],
        input: inputSchema,
        infrastructure: {
          handler: {
            ram: 2048,
            timeout: 30,
            cpu: 1,
            machineType: 'cpu',
          },
          queue: {
            type: 'fifo',
            visibilityTimeout: 31,
            messageGroupId: 'traceId',
            maxRetries: 5,
            retryStrategy: 'exponential',
          },
        },
      } as any,
    }
  }

  function createMockStepWithoutInfrastructure(): BuildStepConfig {
    return {
      type: 'node',
      entrypointPath: '/mock/steps/legacyStep.step.ts',
      filePath: '/mock/project/steps/legacyStep.step.ts',
      config: {
        type: 'event',
        name: 'legacyStep',
        description: 'Legacy step without infrastructure',
        subscribes: ['test.event'],
        emits: [],
      } as any,
    }
  }

  function createMockStepWithPartialInfrastructure(): BuildStepConfig {
    return {
      type: 'node',
      entrypointPath: '/mock/steps/partialStep.step.ts',
      filePath: '/mock/project/steps/partialStep.step.ts',
      config: {
        type: 'event',
        name: 'partialStep',
        description: 'Step with partial infrastructure',
        subscribes: ['test.event'],
        emits: [],
        infrastructure: {
          handler: {
            ram: 4096,
            timeout: 60,
            machineType: 'memory',
          },
        },
      } as any,
    }
  }

  describe('JSON Serialization', () => {
    it('should serialize step with infrastructure config correctly', () => {
      const step = createMockStepWithInfrastructure()
      const stepsConfig = { testStep: step }
      
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile, null, 2)
      const parsed = JSON.parse(json)

      expect(parsed.steps.testStep).toBeDefined()
      expect(parsed.steps.testStep.config.infrastructure).toBeDefined()
      expect(parsed.steps.testStep.config.infrastructure.handler).toBeDefined()
      expect(parsed.steps.testStep.config.infrastructure.queue).toBeDefined()
    })

    it('should serialize handler configuration correctly', () => {
      const step = createMockStepWithInfrastructure()
      const stepsConfig = { testStep: step }
      
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile)
      const parsed = JSON.parse(json)

      const handler = parsed.steps.testStep.config.infrastructure.handler
      expect(handler.ram).toBe(2048)
      expect(handler.timeout).toBe(30)
      expect(handler.cpu).toBe(1)
      expect(handler.machineType).toBe('cpu')
    })

    it('should serialize queue configuration correctly', () => {
      const step = createMockStepWithInfrastructure()
      const stepsConfig = { testStep: step }
      
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile)
      const parsed = JSON.parse(json)

      const queue = parsed.steps.testStep.config.infrastructure.queue
      expect(queue.type).toBe('fifo')
      expect(queue.visibilityTimeout).toBe(31)
      expect(queue.messageGroupId).toBe('traceId')
      expect(queue.maxRetries).toBe(5)
      expect(queue.retryStrategy).toBe('exponential')
    })

    it('should serialize partial infrastructure config correctly', () => {
      const step = createMockStepWithPartialInfrastructure()
      const stepsConfig = { partialStep: step }
      
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile)
      const parsed = JSON.parse(json)

      expect(parsed.steps.partialStep.config.infrastructure).toBeDefined()
      expect(parsed.steps.partialStep.config.infrastructure.handler).toBeDefined()
      expect(parsed.steps.partialStep.config.infrastructure.queue).toBeUndefined()
      
      const handler = parsed.steps.partialStep.config.infrastructure.handler
      expect(handler.ram).toBe(4096)
      expect(handler.timeout).toBe(60)
      expect(handler.machineType).toBe('memory')
    })
  })

  describe('Backward Compatibility', () => {
    it('should serialize step without infrastructure config correctly', () => {
      const step = createMockStepWithoutInfrastructure()
      const stepsConfig = { legacyStep: step }
      
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile, null, 2)
      const parsed = JSON.parse(json)

      expect(parsed.steps.legacyStep).toBeDefined()
      expect(parsed.steps.legacyStep.config.name).toBe('legacyStep')
      expect(parsed.steps.legacyStep.config.type).toBe('event')
      expect(parsed.steps.legacyStep.config.infrastructure).toBeUndefined()
    })

    it('should handle mixed steps (with and without infrastructure)', () => {
      const stepWithInfra = createMockStepWithInfrastructure()
      const stepWithoutInfra = createMockStepWithoutInfrastructure()
      
      const stepsConfig = {
        testStep: stepWithInfra,
        legacyStep: stepWithoutInfra,
      }
      
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile)
      const parsed = JSON.parse(json)

      expect(parsed.steps.testStep.config.infrastructure).toBeDefined()
      expect(parsed.steps.legacyStep.config.infrastructure).toBeUndefined()
    })

    it('should maintain all existing step properties when infrastructure is added', () => {
      const step = createMockStepWithInfrastructure()
      const stepsConfig = { testStep: step }
      
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile)
      const parsed = JSON.parse(json)

      const config = parsed.steps.testStep.config
      expect(config.type).toBe('event')
      expect(config.name).toBe('testStep')
      expect(config.description).toBe('Test step with infrastructure')
      expect(config.subscribes).toEqual(['test.event'])
      expect(config.emits).toEqual([])
    })

    it('should not break existing step configs when infrastructure field is absent', () => {
      const apiStep: BuildStepConfig = {
        type: 'node',
        entrypointPath: '/mock/steps/apiStep.step.ts',
        filePath: '/mock/project/steps/apiStep.step.ts',
        config: {
          type: 'api',
          name: 'apiStep',
          description: 'API step without infrastructure',
          path: '/test',
          method: 'GET',
          emits: [],
        } as any,
      }
      
      const stepsConfig = { apiStep }
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile)
      const parsed = JSON.parse(json)

      expect(parsed.steps.apiStep.config.type).toBe('api')
      expect(parsed.steps.apiStep.config.path).toBe('/test')
      expect(parsed.steps.apiStep.config.method).toBe('GET')
      expect(parsed.steps.apiStep.config.infrastructure).toBeUndefined()
    })

    it('should not break existing cron step configs', () => {
      const cronStep: BuildStepConfig = {
        type: 'node',
        entrypointPath: '/mock/steps/cronStep.step.ts',
        filePath: '/mock/project/steps/cronStep.step.ts',
        config: {
          type: 'cron',
          name: 'cronStep',
          description: 'Cron step without infrastructure',
          cron: '0 0 * * *',
          emits: [],
        } as any,
      }
      
      const stepsConfig = { cronStep }
      const stepsFile: StepsConfigFile = {
        steps: stepsConfig,
        streams: {},
        routers: {},
      }

      const json = JSON.stringify(stepsFile)
      const parsed = JSON.parse(json)

      expect(parsed.steps.cronStep.config.type).toBe('cron')
      expect(parsed.steps.cronStep.config.cron).toBe('0 0 * * *')
      expect(parsed.steps.cronStep.config.infrastructure).toBeUndefined()
    })
  })

  describe('Deserialization', () => {
    it('should deserialize step with infrastructure config correctly', () => {
      const jsonString = JSON.stringify({
        steps: {
          testStep: {
            type: 'node',
            entrypointPath: '/mock/steps/testStep.step.ts',
            filePath: '/mock/project/steps/testStep.step.ts',
            config: {
              type: 'event',
              name: 'testStep',
              subscribes: ['test.event'],
              emits: [],
              infrastructure: {
                handler: {
                  ram: 2048,
                  timeout: 30,
                  machineType: 'cpu',
                },
                queue: {
                  type: 'standard',
                  visibilityTimeout: 60,
                  maxRetries: 3,
                  retryStrategy: 'none',
                },
              },
            },
          },
        },
        streams: {},
        routers: {},
      })

      const parsed: StepsConfigFile = JSON.parse(jsonString)

      expect(parsed.steps.testStep).toBeDefined()
      
      const config = parsed.steps.testStep.config as any
      expect(config.infrastructure).toBeDefined()
      
      const infra = config.infrastructure
      expect(infra.handler.ram).toBe(2048)
      expect(infra.queue.type).toBe('standard')
    })

    it('should deserialize step without infrastructure config correctly', () => {
      const jsonString = JSON.stringify({
        steps: {
          legacyStep: {
            type: 'node',
            entrypointPath: '/mock/steps/legacyStep.step.ts',
            filePath: '/mock/project/steps/legacyStep.step.ts',
            config: {
              type: 'event',
              name: 'legacyStep',
              subscribes: ['test.event'],
              emits: [],
            },
          },
        },
        streams: {},
        routers: {},
      })

      const parsed: StepsConfigFile = JSON.parse(jsonString)

      expect(parsed.steps.legacyStep).toBeDefined()
      expect((parsed.steps.legacyStep.config as any).infrastructure).toBeUndefined()
    })
  })

  describe('Type Safety', () => {
    it('should maintain type safety with infrastructure config', () => {
      const step = createMockStepWithInfrastructure()
      
      const config = step.config as any
      expect(config.infrastructure).toBeDefined()
      expect(typeof config.infrastructure).toBe('object')
      expect(typeof config.infrastructure.handler).toBe('object')
      expect(typeof config.infrastructure.queue).toBe('object')
    })

    it('should handle undefined infrastructure gracefully', () => {
      const step = createMockStepWithoutInfrastructure()
      
      const config = step.config as any
      expect(config.infrastructure).toBeUndefined()
      
      expect(() => {
        const infra = config.infrastructure
        if (infra) {
          console.log(infra.handler)
        }
      }).not.toThrow()
    })
  })
})

