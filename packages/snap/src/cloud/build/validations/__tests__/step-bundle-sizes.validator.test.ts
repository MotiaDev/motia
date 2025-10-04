import { Builder } from '../../builder'
import { stepBundleSizesValidator } from '../step-bundle-sizes.validator'
import { BUNDLE_SIZE_LIMITS, BYTES_TO_MB } from '../constants'
import { BuildStepConfig } from '../../builder'

describe('stepBundleSizesValidator', () => {
  const createMockBuilder = (
    stepsConfig: Record<string, BuildStepConfig>,
    stepSizes: Map<string, number> = new Map(),
  ): Builder => {
    return {
      projectDir: '/project',
      stepsConfig,
      streamsConfig: {},
      routersConfig: {},
      stepUncompressedSizes: stepSizes,
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

  const createMockStep = (name: string, filePath: string): BuildStepConfig => ({
    type: 'node',
    entrypointPath: filePath,
    config: { name, type: 'event' } as BuildStepConfig['config'],
    filePath,
  })

  it('should return no errors when step size is within limits', () => {
    const filePath = '/project/step1.ts'
    const stepSizes = new Map([[filePath, 100 * BYTES_TO_MB]])
    const builder = createMockBuilder({ [filePath]: createMockStep('step1', filePath) }, stepSizes)

    const result = stepBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return error when step size exceeds limit', () => {
    const filePath = '/project/step1.ts'
    const stepSizes = new Map([[filePath, (BUNDLE_SIZE_LIMITS.STEP_MAX_MB + 1) * BYTES_TO_MB]])
    const builder = createMockBuilder({ [filePath]: createMockStep('step1', filePath) }, stepSizes)

    const result = stepBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('exceeds')
    expect(result.errors[0].message).toContain('250MB')
  })

  it('should handle steps with no size information', () => {
    const filePath = '/project/step1.ts'
    const builder = createMockBuilder({ [filePath]: createMockStep('step1', filePath) }, new Map())

    const result = stepBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(0)
  })

  it('should return errors for multiple oversized steps', () => {
    const filePath1 = '/project/step1.ts'
    const filePath2 = '/project/step2.ts'
    const oversizedValue = (BUNDLE_SIZE_LIMITS.STEP_MAX_MB + 10) * BYTES_TO_MB
    const stepSizes = new Map([
      [filePath1, oversizedValue],
      [filePath2, oversizedValue],
    ])
    const builder = createMockBuilder(
      {
        [filePath1]: createMockStep('step1', filePath1),
        [filePath2]: createMockStep('step2', filePath2),
      },
      stepSizes,
    )

    const result = stepBundleSizesValidator(builder)

    expect(result.errors).toHaveLength(2)
  })
})
