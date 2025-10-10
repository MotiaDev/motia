import { Builder, BuildStepConfig } from '../../builder'
import { buildValidation, validateStepsConfig } from '../../build-validation'
import { BuildListener } from '../../../new-deployment/listeners/listener.types'

describe('buildValidation', () => {
  const createMockBuilder = (): Builder => {
    return {
      projectDir: '/project',
      stepsConfig: {
        '/step1.ts': {
          type: 'node',
          entrypointPath: '/project/step1.ts',
          config: { name: 'step1', type: 'event' },
          filePath: '/project/step1.ts',
        },
      },
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

  const createMockListener = (): BuildListener => {
    return {
      onBuildWarning: jest.fn(),
      onBuildErrors: jest.fn(),
    } as Partial<BuildListener> as BuildListener
  }

  it('should return true when there are no errors or warnings', () => {
    const builder = createMockBuilder()
    const listener = createMockListener()

    const result = buildValidation(builder, listener)

    expect(result).toBe(true)
    expect(listener.onBuildWarning).not.toHaveBeenCalled()
    expect(listener.onBuildErrors).not.toHaveBeenCalled()
  })

  it('should return false when there are errors', () => {
    const builder = createMockBuilder()
    builder.stepsConfig['/step2.ts'] = {
      type: 'node',
      entrypointPath: '/project/step2.ts',
      config: { name: 'step1', type: 'event' } as BuildStepConfig['config'],
      filePath: '/project/step2.ts',
    }
    const listener = createMockListener()

    const result = buildValidation(builder, listener)

    expect(result).toBe(false)
    expect(listener.onBuildErrors).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('Duplicate step names'),
        }),
      ]),
    )
  })
})

describe('validateStepsConfig', () => {
  it('should aggregate errors and warnings from all validators', () => {
    const builder = {
      projectDir: '/project',
      stepsConfig: {
        '/step1.ts': {
          type: 'node',
          entrypointPath: '/project/step1.ts',
          config: {
            name: 'a'.repeat(50),
            type: 'cron',
            cron: 'invalid',
          },
          filePath: '/project/step1.ts',
        },
      },
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

    const result = validateStepsConfig(builder)

    expect(result.errors.length).toBeGreaterThan(0)
  })
})
