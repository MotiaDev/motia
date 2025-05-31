import path from 'path'
import { Step, StepConfig } from '@motiadev/core'
import { BuildPrinter } from './printer'
import { Stream } from '@motiadev/core/dist/src/types-stream'

export type StepType = 'node' | 'python' | 'noop' | 'unknown'

export type BuildStepConfig = {
  type: StepType
  entrypointPath: string
  config: StepConfig
  filePath: string
}

export type BuildStreamConfig = {
  name: string
  storageType: 'state' | 'custom'
}

export type BuildStepsConfig = Record<string, BuildStepConfig>
export type BuildStreamsConfig = Record<string, BuildStreamConfig>

export interface StepBuilder {
  build(step: Step): Promise<void>
}

export class Builder {
  public readonly printer: BuildPrinter
  public readonly distDir: string
  public readonly stepsConfig: BuildStepsConfig
  public readonly streamsConfig: BuildStreamsConfig
  public modulegraphInstalled: boolean = false
  private readonly builders: Map<string, StepBuilder> = new Map()

  constructor(public readonly projectDir: string) {
    this.distDir = path.join(projectDir, 'dist')
    this.stepsConfig = {}
    this.streamsConfig = {}
    this.printer = new BuildPrinter()
  }

  registerBuilder(type: string, builder: StepBuilder) {
    this.builders.set(type, builder)
  }

  registerStateStream(stream: Stream) {
    this.printer.printStreamCreated(stream)

    this.streamsConfig[stream.config.name] = {
      name: stream.config.name,
      storageType: stream.config.baseConfig.storageType,
    }
  }

  registerStep(args: { entrypointPath: string; bundlePath: string; step: Step; type: StepType }) {
    this.stepsConfig[args.bundlePath] = {
      type: args.type,
      entrypointPath: args.entrypointPath,
      config: args.step.config,
      filePath: args.step.filePath,
    }
  }

  async buildStep(step: Step): Promise<void> {
    const type = this.determineStepType(step)
    const builder = this.builders.get(type)

    if (!builder) {
      this.printer.printStepSkipped(step, `No builder found for type: ${type}`)
      return
    }

    try {
      await builder.build(step)
    } catch (err) {
      this.printer.printStepFailed(step, err as Error)
      throw err
    }
  }

  private determineStepType(step: Step): string {
    if (step.config.type === 'noop') {
      return 'noop'
    } else if (step.filePath.endsWith('.ts') || step.filePath.endsWith('.js')) {
      return 'node'
    } else if (step.filePath.endsWith('.py')) {
      return 'python'
    } else if (step.filePath.endsWith('.rb')) {
      return 'ruby'
    }
    return 'unknown'
  }
}
