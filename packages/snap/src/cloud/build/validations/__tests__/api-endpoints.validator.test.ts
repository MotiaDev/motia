import { Builder } from '../../builder'
import { apiEndpointsValidator } from '../api-endpoints.validator'
import { BuildStepConfig } from '../../builder'

describe('apiEndpointsValidator', () => {
  const createMockBuilder = (stepsConfig: Record<string, BuildStepConfig>): Builder => {
    return {
      projectDir: '/project',
      stepsConfig,
      streamsConfig: {},
      routersConfig: {},
      stepUncompressedSizes: new Map(),
      stepCompressedSizes: new Map(),
      routerUncompressedSizes: new Map(),
      routerCompressedSizes: new Map(),
      modulegraphInstalled: false,
      registerBuilder: jest.fn(),
      registerStateStream: jest.fn(),
      registerStep: jest.fn(),
      recordStepSize: jest.fn(),
      buildStep: jest.fn(),
      buildApiSteps: jest.fn(),
    } as unknown as Builder
  }

  const createMockApiStep = (name: string, filePath: string, method: string, path: string): BuildStepConfig => ({
    type: 'node',
    entrypointPath: filePath,
    config: { name, type: 'api', method, path } as BuildStepConfig['config'],
    filePath,
  })

  it('should return no errors when all endpoints are unique', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockApiStep('step1', '/project/step1.ts', 'GET', '/users'),
      '/step2.ts': createMockApiStep('step2', '/project/step2.ts', 'POST', '/users'),
      '/step3.ts': createMockApiStep('step3', '/project/step3.ts', 'GET', '/posts'),
    })

    const result = apiEndpointsValidator(builder)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return error when endpoints conflict', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockApiStep('step1', '/project/step1.ts', 'GET', '/users'),
      '/step2.ts': createMockApiStep('step2', '/project/step2.ts', 'GET', '/users'),
    })

    const result = apiEndpointsValidator(builder)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Endpoint conflict')
    expect(result.errors[0].message).toContain('GET /users')
  })

  it('should skip non-api steps', () => {
    const builder = createMockBuilder({
      '/step1.ts': {
        type: 'node',
        entrypointPath: '/project/step1.ts',
        config: { name: 'step1', type: 'event' } as BuildStepConfig['config'],
        filePath: '/project/step1.ts',
      },
    })

    const result = apiEndpointsValidator(builder)

    expect(result.errors).toHaveLength(0)
  })

  it('should allow same path with different methods', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockApiStep('step1', '/project/step1.ts', 'GET', '/users'),
      '/step2.ts': createMockApiStep('step2', '/project/step2.ts', 'POST', '/users'),
      '/step3.ts': createMockApiStep('step3', '/project/step3.ts', 'DELETE', '/users'),
    })

    const result = apiEndpointsValidator(builder)

    expect(result.errors).toHaveLength(0)
  })
})
