import path from 'path'
import { getStepConfig } from '../get-step-config'
import type { ApiRouteConfig, CronConfig, EventConfig, NoopConfig } from '../types'

describe('Get Config', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  it('should get the config from a node file', async () => {
    const baseDir = __dirname
    const mockApiStep = await getStepConfig(path.join(baseDir, 'steps', 'api-step.ts'))

    expect(mockApiStep).toBeDefined()
    expect(mockApiStep?.type).toEqual('api')

    const apiStep = mockApiStep as ApiRouteConfig

    expect(apiStep.path).toEqual('/test')
    expect(apiStep.method).toEqual('POST')
  })

  it('should get the config from a python file', async () => {
    const baseDir = __dirname
    const mockApiStep = await getStepConfig(path.join(baseDir, 'steps', 'api-step.py'))

    expect(mockApiStep).toBeDefined()
    expect(mockApiStep?.type).toEqual('api')

    const apiStep = mockApiStep as ApiRouteConfig

    expect(apiStep.path).toEqual('/test')
    expect(apiStep.method).toEqual('POST')
  })

  it('should get the config from a ruby file', async () => {
    const baseDir = __dirname
    const mockApiStep = await getStepConfig(path.join(baseDir, 'steps', 'api-step.rb'))

    expect(mockApiStep).toBeDefined()
    expect(mockApiStep?.type).toEqual('api')

    const apiStep = mockApiStep as ApiRouteConfig

    expect(apiStep.path).toEqual('/test')
    expect(apiStep.method).toEqual('POST')
  })

  it('should get the config from a c# file', async () => {
    const baseDir = __dirname
    const mockApiStep = await getStepConfig(path.join(baseDir, 'steps', 'api-step.cs'))

    expect(mockApiStep).toBeDefined()
    expect(mockApiStep?.type).toEqual('api')

    const apiStep = mockApiStep as ApiRouteConfig

    expect(apiStep.path).toEqual('/test')
    expect(apiStep.method).toEqual('POST')
  })

  it('should get the config from a c# event step file', async () => {
    const baseDir = __dirname
    const mockEventStep = await getStepConfig(path.join(baseDir, 'steps', 'event-step.cs'))

    expect(mockEventStep).toBeDefined()
    expect(mockEventStep?.type).toEqual('event')

    const eventStep = mockEventStep as EventConfig

    expect(eventStep.name).toEqual('event-step')
    expect(eventStep.subscribes).toEqual(['TEST_EVENT'])
    expect(eventStep.emits).toEqual(['PROCESSED_EVENT'])
  })

  it('should get the config from a c# cron step file', async () => {
    const baseDir = __dirname
    const mockCronStep = await getStepConfig(path.join(baseDir, 'steps', 'cron-step.cs'))

    expect(mockCronStep).toBeDefined()
    expect(mockCronStep?.type).toEqual('cron')

    const cronStep = mockCronStep as CronConfig

    expect(cronStep.name).toEqual('cron-step')
    expect(cronStep.cron).toEqual('*/5 * * * *')
    expect(cronStep.emits).toEqual(['CRON_EVENT'])
  })

  it('should get the config from a c# noop step file', async () => {
    const baseDir = __dirname
    const mockNoopStep = await getStepConfig(path.join(baseDir, 'steps', 'noop-step.cs'))

    expect(mockNoopStep).toBeDefined()
    expect(mockNoopStep?.type).toEqual('noop')

    const noopStep = mockNoopStep as NoopConfig

    expect(noopStep.name).toEqual('noop-step')
    expect(noopStep.description).toEqual('Virtual step for flow visualization')
  })
})
