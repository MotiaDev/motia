import type { ApiRouteConfig, Step, StepConfig, Stream } from '@motiadev/core'
import type { BuildListener } from '../new-deployment/listeners/listener.types'

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
export type BuildRoutersConfig = Partial<Record<StepType, string>>
export type StepsConfigFile = {
  steps: BuildStepsConfig
  streams: BuildStreamsConfig
  routers: BuildRoutersConfig
}

export interface RouterBuildResult {
  compressedSize: number
  uncompressedSize: number
  path: string
}

export interface StepBuilder {
  build(step: Step): Promise<void>
  buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<RouterBuildResult>
}

export class Builder {
  public readonly stepsConfig: BuildStepsConfig
  public readonly streamsConfig: BuildStreamsConfig
  public routersConfig: BuildRoutersConfig
  public readonly stepCompressedSizes: Map<string, number> = new Map()
  public readonly stepUncompressedSizes: Map<string, number> = new Map()
  public readonly routerCompressedSizes: Map<string, number> = new Map()
  public readonly routerUncompressedSizes: Map<string, number> = new Map()
  public modulegraphInstalled: boolean = false
  private readonly builders: Map<string, StepBuilder> = new Map()

  constructor(
    public readonly projectDir: string,
    private readonly listener: BuildListener,
  ) {
    this.stepsConfig = {}
    this.streamsConfig = {}
    this.routersConfig = {}
  }

  registerBuilder(type: string, builder: StepBuilder) {
    this.builders.set(type, builder)
  }

  registerStateStream(stream: Stream) {
    this.listener.onStreamCreated(stream)

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

  recordStepSize(step: Step, compressedSize: number, uncompressedSize: number) {
    this.stepCompressedSizes.set(step.filePath, compressedSize)
    this.stepUncompressedSizes.set(step.filePath, uncompressedSize)
  }

  async buildStep(step: Step): Promise<void> {
    const type = this.determineStepType(step)
    const builder = this.builders.get(type)

    if (!builder) {
      this.listener.onBuildSkip(step, `No builder found for type: ${type}`)
      return
    }

    try {
      await builder.build(step)
    } catch (err) {
      this.listener.onBuildError(step, err as Error)
      throw err
    }
  }

  async buildApiSteps(steps: Step<ApiRouteConfig>[]): Promise<void> {
    const nodeSteps = steps.filter((step) => this.determineStepType(step) === 'node')
    const pythonSteps = steps.filter((step) => this.determineStepType(step) === 'python')
    const nodeBuilder = this.builders.get('node')
    const pythonBuilder = this.builders.get('python')

    this.routersConfig = {}

    if (nodeSteps.length > 0 && nodeBuilder) {
      this.listener.onApiRouterBuilding('node')
      const { compressedSize, uncompressedSize, path } = await nodeBuilder.buildApiSteps(nodeSteps)
      this.listener.onApiRouterBuilt('node', compressedSize)
      this.routersConfig.node = path
      this.routerCompressedSizes.set('node', compressedSize)
      this.routerUncompressedSizes.set('node', uncompressedSize)
    }
    if (pythonSteps.length > 0 && pythonBuilder) {
      this.listener.onApiRouterBuilding('python')
      const { compressedSize, uncompressedSize, path } = await pythonBuilder.buildApiSteps(pythonSteps)
      this.listener.onApiRouterBuilt('python', compressedSize)
      this.routersConfig.python = path
      this.routerCompressedSizes.set('python', compressedSize)
      this.routerUncompressedSizes.set('python', uncompressedSize)
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
