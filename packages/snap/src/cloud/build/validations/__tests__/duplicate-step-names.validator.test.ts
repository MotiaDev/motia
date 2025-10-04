import { Builder } from '../../builder'
import { duplicateStepNamesValidator } from '../duplicate-step-names.validator'
import { BuildStepConfig } from '../../builder'

describe('duplicateStepNamesValidator', () => {
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

  it('should return no errors when all step names are unique', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockStep('step1', '/project/step1.ts'),
      '/step2.ts': createMockStep('step2', '/project/step2.ts'),
      '/step3.ts': createMockStep('step3', '/project/step3.ts'),
    })

    const result = duplicateStepNamesValidator(builder)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return errors when duplicate step names exist', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockStep('duplicateName', '/project/step1.ts'),
      '/step2.ts': createMockStep('duplicateName', '/project/step2.ts'),
    })

    const result = duplicateStepNamesValidator(builder)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Duplicate step names')
    expect(result.errors[0].message).toContain('duplicateName')
  })

  it('should return multiple errors for multiple duplicates', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockStep('name1', '/project/step1.ts'),
      '/step2.ts': createMockStep('name1', '/project/step2.ts'),
      '/step3.ts': createMockStep('name2', '/project/step3.ts'),
      '/step4.ts': createMockStep('name2', '/project/step4.ts'),
    })

    const result = duplicateStepNamesValidator(builder)

    expect(result.errors).toHaveLength(2)
  })

  it('should handle empty steps config', () => {
    const builder = createMockBuilder({})

    const result = duplicateStepNamesValidator(builder)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})
