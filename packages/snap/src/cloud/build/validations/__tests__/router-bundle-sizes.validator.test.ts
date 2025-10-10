import { Builder, BuildStepConfig } from '../../builder'
import { routerBundleSizesValidator } from '../router-bundle-sizes.validator'
import { BUNDLE_SIZE_LIMITS, BYTES_TO_MB } from '../constants'

describe('routerBundleSizesValidator', () => {
  const createMockBuilder = (routerSizes: Map<string, number> = new Map()): Builder => {
    return {
      projectDir: '/project',
      stepsConfig: {
        '/step1.ts': {
          type: 'node',
          entrypointPath: '/project/step1.ts',
          config: { name: 'step1', type: 'api' } as BuildStepConfig['config'],
          filePath: '/project/step1.ts',
        },
      },
      streamsConfig: {},
      routersConfig: {},
      stepUncompressedSizes: new Map(),
      stepCompressedSizes: new Map(),
      routerUncompressedSizes: routerSizes,
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

  it('should return no errors when router size is within limits', () => {
    const routerSizes = new Map([['node', 100 * BYTES_TO_MB]])
    const builder = createMockBuilder(routerSizes)

    const result = routerBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return error when router size exceeds limit', () => {
    const routerSizes = new Map([['node', (BUNDLE_SIZE_LIMITS.ROUTER_MAX_MB + 1) * BYTES_TO_MB]])
    const builder = createMockBuilder(routerSizes)

    const result = routerBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('exceeds')
    expect(result.errors[0].message).toContain('150MB')
  })

  it('should handle multiple routers', () => {
    const routerSizes = new Map([
      ['node', 100 * BYTES_TO_MB],
      ['python', 120 * BYTES_TO_MB],
    ])
    const builder = createMockBuilder(routerSizes)

    const result = routerBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(0)
  })

  it('should return errors for multiple oversized routers', () => {
    const oversizedValue = (BUNDLE_SIZE_LIMITS.ROUTER_MAX_MB + 10) * BYTES_TO_MB
    const routerSizes = new Map([
      ['node', oversizedValue],
      ['python', oversizedValue],
    ])
    const builder = createMockBuilder(routerSizes)

    const result = routerBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(2)
  })

  it('should handle empty router sizes', () => {
    const builder = createMockBuilder(new Map())

    const result = routerBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(0)
  })
})
