import path from 'path'
import { getStepConfig } from '../get-step-config'
import { ApiRouteConfig } from '../types'

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
})
