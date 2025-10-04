import { Builder } from '../../builder'
import { cronExpressionsValidator } from '../cron-expressions.validator'
import { BuildStepConfig } from '../../builder'

describe('cronExpressionsValidator', () => {
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

  const createMockCronStep = (name: string, filePath: string, cronExpression: string): BuildStepConfig => ({
    type: 'node',
    entrypointPath: filePath,
    config: { name, type: 'cron', cron: cronExpression } as BuildStepConfig['config'],
    filePath,
  })

  it('should return no errors for valid cron expressions', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockCronStep('step1', '/project/step1.ts', '0 0 * * *'),
      '/step2.ts': createMockCronStep('step2', '/project/step2.ts', '*/5 * * * *'),
    })

    const result = cronExpressionsValidator(builder)

    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return error for invalid cron expression', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockCronStep('step1', '/project/step1.ts', 'invalid cron'),
    })

    const result = cronExpressionsValidator(builder)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('invalid cron expression')
    expect(result.errors[0].message).toContain('invalid cron')
  })

  it('should skip non-cron steps', () => {
    const builder = createMockBuilder({
      '/step1.ts': {
        type: 'node',
        entrypointPath: '/project/step1.ts',
        config: { name: 'step1', type: 'event' } as BuildStepConfig['config'],
        filePath: '/project/step1.ts',
      },
    })

    const result = cronExpressionsValidator(builder)

    expect(result.errors).toHaveLength(0)
  })

  it('should return multiple errors for multiple invalid cron expressions', () => {
    const builder = createMockBuilder({
      '/step1.ts': createMockCronStep('step1', '/project/step1.ts', 'invalid1'),
      '/step2.ts': createMockCronStep('step2', '/project/step2.ts', 'invalid2'),
    })

    const result = cronExpressionsValidator(builder)

    expect(result.errors).toHaveLength(2)
  })
})
