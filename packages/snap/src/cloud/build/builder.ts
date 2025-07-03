import path from 'path'
import { ApiRouteConfig, ApiRouteHandler, Step, StepConfig } from '@motiadev/core'
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
  storageType: 'default' | 'custom'
}

export type BuildStepsConfig = Record<string, BuildStepConfig>
export type BuildStreamsConfig = Record<string, BuildStreamConfig>
export type StepsConfigFile = { steps: BuildStepsConfig; streams: BuildStreamsConfig }

export interface StepBuilder {
  build(step: Step): Promise<void>
  buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<number>
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

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<void> {
    const nodeSteps = steps.filter((step) => this.determineStepType(step) === 'node')
    const pythonSteps = steps.filter((step) => this.determineStepType(step) === 'python')
    const nodeBuilder = this.builders.get('node')
    const pythonBuilder = this.builders.get('python')

    if (nodeSteps.length > 0 && nodeBuilder) {
      this.printer.printApiRouterBuilding('node')
      const size = await nodeBuilder.buildApiSteps(nodeSteps)
      this.printer.printApiRouterBuilt('node', size)
    }
    if (pythonSteps.length > 0 && pythonBuilder) {
      this.printer.printApiRouterBuilding('python')
      const size = await pythonBuilder.buildApiSteps(pythonSteps)
      this.printer.printApiRouterBuilt('python', size)
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
