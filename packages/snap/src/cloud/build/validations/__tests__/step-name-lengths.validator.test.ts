import { Builder } from '../../builder'
import { stepNameLengthsValidator } from '../step-name-lengths.validator'
import { BUNDLE_SIZE_LIMITS } from '../constants'
import { BuildStepConfig } from '../../builder'

describe('stepNameLengthsValidator', () => {
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

  const createMockStep = (name: string, filePath: string): BuildStepConfig => ({
    type: 'node',
    entrypointPath: filePath,
    config: { name, type: 'event' } as BuildStepConfig['config'],
    filePath,
  })

  it('should return no errors when step names are within length limit', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockStep('shortName', '/project/step1.ts'),
      '/step2.ts': createMockStep('anotherShortName', '/project/step2.ts'),
    })

    const result = stepNameLengthsValidator(builder)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return error when step name exceeds length limit', () => {
    const longName = 'a'.repeat(BUNDLE_SIZE_LIMITS.STEP_NAME_MAX_LENGTH + 1)
    const builder = createMockBuilder({
      '/step1.ts': createMockStep(longName, '/project/step1.ts'),
    })

    const result = stepNameLengthsValidator(builder)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('too long')
    expect(result.errors[0].message).toContain('40 characters')
  })

  it('should accept step name exactly at the limit', () => {
    const exactLengthName = 'a'.repeat(BUNDLE_SIZE_LIMITS.STEP_NAME_MAX_LENGTH)
    const builder = createMockBuilder({
      '/step1.ts': createMockStep(exactLengthName, '/project/step1.ts'),
    })

    const result = stepNameLengthsValidator(builder)

    expect(result.errors).toHaveLength(0)
  })

  it('should return multiple errors for multiple long names', () => {
    const longName1 = 'a'.repeat(BUNDLE_SIZE_LIMITS.STEP_NAME_MAX_LENGTH + 1)
    const longName2 = 'b'.repeat(BUNDLE_SIZE_LIMITS.STEP_NAME_MAX_LENGTH + 5)
    const builder = createMockBuilder({
      '/step1.ts': createMockStep(longName1, '/project/step1.ts'),
      '/step2.ts': createMockStep(longName2, '/project/step2.ts'),
    })

    const result = stepNameLengthsValidator(builder)

    expect(result.errors).toHaveLength(2)
  })
})
