import path from 'path'
import { getStepConfig } from '../get-step-config'
import { StepConfig } from '../types'

describe('Get Config', () => {
  beforeAll(() => {
    process.env._MOTIA_TEST_MODE = 'true'
  })

  it('should get the config from a node file', async () => {
    const baseDir = __dirname
    const mockApiStep = await getStepConfig(path.join(baseDir, 'steps', 'api-step.ts'))

    expect(mockApiStep).toBeDefined()
    expect(mockApiStep?.triggers).toBeDefined()
    expect(mockApiStep?.triggers.length).toBeGreaterThan(0)
    expect(mockApiStep?.triggers[0].type).toEqual('api')

    const apiStep = mockApiStep as StepConfig

    expect(apiStep.path).toEqual('/test')
    expect(apiStep.method).toEqual('POST')
  })

  it('should get the config from a python file', async () => {
    const baseDir = __dirname
    const mockApiStep = await getStepConfig(path.join(baseDir, 'steps', 'api-step.py'))

    expect(mockApiStep).toBeDefined()
    expect(mockApiStep?.triggers).toBeDefined()
    expect(mockApiStep?.triggers.length).toBeGreaterThan(0)
    expect(mockApiStep?.triggers[0].type).toEqual('api')

    const apiStep = mockApiStep as StepConfig

    expect(apiStep.path).toEqual('/test')
    expect(apiStep.method).toEqual('POST')
  })

  it('should get the config from a ruby file', async () => {
    const baseDir = __dirname
    const mockApiStep = await getStepConfig(path.join(baseDir, 'steps', 'api-step.rb'))

    expect(mockApiStep).toBeDefined()
    expect(mockApiStep?.triggers).toBeDefined()
    expect(mockApiStep?.triggers.length).toBeGreaterThan(0)
    expect(mockApiStep?.triggers[0].type).toEqual('api')

    const apiStep = mockApiStep as StepConfig

    expect(apiStep.path).toEqual('/test')
    expect(apiStep.method).toEqual('POST')
  })
})
