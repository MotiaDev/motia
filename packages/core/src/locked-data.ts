import fs from 'fs'
import path from 'path'
import type { RedisClientType } from 'redis'
import type { StreamAdapter } from './adapters/interfaces/stream-adapter.interface'
import type { StreamAdapterManager } from './adapters/interfaces/stream-adapter-manager.interface'
import { isApiStep, isCronStep, isEventStep } from './guards'
import { PLUGIN_FLOW_ID } from './motia'
import type { Printer } from './printer'
import { validateStep } from './step-validator'
import type { StreamFactory } from './streams/stream-factory'
import type { ApiRouteConfig, CronConfig, EventConfig, Flow, Step } from './types'
import { generateTypesFromSteps, generateTypesFromStreams, generateTypesString } from './types/generate-types'
import type { Stream } from './types-stream'

type FlowEvent = 'flow-created' | 'flow-removed' | 'flow-updated'
type StepEvent = 'step-created' | 'step-removed' | 'step-updated'
type StreamEvent = 'stream-created' | 'stream-removed' | 'stream-updated'

type StreamWrapper<TData> = (streamName: string, factory: StreamFactory<TData>) => StreamFactory<TData>

export class LockedData {
  public flows: Record<string, Flow>
  public activeSteps: Step[]
  public devSteps: Step[]

  private stepsMap: Record<string, Step>
  private handlers: Record<FlowEvent, ((flowName: string) => void)[]>
  private stepHandlers: Record<StepEvent, ((step: Step) => void)[]>
  private streamHandlers: Record<StreamEvent, ((stream: Stream) => void)[]>
  private streams: Record<string, Stream>

  private streamWrapper?: StreamWrapper<any>

  constructor(
    public readonly baseDir: string,
    public readonly streamAdapter: StreamAdapterManager,
    private readonly printer: Printer,
    public readonly redisClient: RedisClientType,
  ) {
    this.flows = {}
    this.activeSteps = []
    this.devSteps = []
    this.stepsMap = {}

    this.handlers = {
      'flow-created': [],
      'flow-removed': [],
      'flow-updated': [],
    }

    this.stepHandlers = {
      'step-created': [],
      'step-removed': [],
      'step-updated': [],
    }

    this.streamHandlers = {
      'stream-created': [],
      'stream-removed': [],
      'stream-updated': [],
    }

    this.streams = {}
  }

  applyStreamWrapper<TData>(streamWrapper: StreamWrapper<TData>): void {
    this.streamWrapper = streamWrapper
  }

  saveTypes() {
    const types = generateTypesFromSteps(this.activeSteps, this.printer)
    const streams = generateTypesFromStreams(this.streams)
    const typesString = generateTypesString(types, streams)
    fs.writeFileSync(path.join(this.baseDir, 'types.d.ts'), typesString)
  }

  on(event: FlowEvent, handler: (flowName: string) => void) {
    this.handlers[event].push(handler)
  }

  onStep(event: StepEvent, handler: (step: Step) => void) {
    this.stepHandlers[event].push(handler)
  }

  onStream(event: StreamEvent, handler: (stream: Stream) => void) {
    this.streamHandlers[event].push(handler)
  }

  getActiveSteps() {
    return this.activeSteps.filter((step) => !step.config.flows?.includes(PLUGIN_FLOW_ID))
  }

  eventSteps(): Step<EventConfig>[] {
    return this.getActiveSteps().filter(isEventStep)
  }

  apiSteps(): Step<ApiRouteConfig>[] {
    return this.getActiveSteps().filter(isApiStep)
  }

  cronSteps(): Step<CronConfig>[] {
    return this.getActiveSteps().filter(isCronStep)
  }

  pythonSteps(): Step[] {
    return this.getActiveSteps().filter((step) => step.filePath.endsWith('.py'))
  }

  tsSteps(): Step[] {
    return this.getActiveSteps().filter((step) => step.filePath.endsWith('.ts'))
  }

  getStreams(): Record<string, StreamFactory<any>> {
    const streams: Record<string, StreamFactory<unknown>> = {}

    for (const [key, value] of Object.entries(this.streams)) {
      streams[key] = value.factory
    }

    return streams
  }

  listStreams(): Stream[] {
    return Object.values(this.streams)
  }

  findStream(path: string): Stream | undefined {
    return Object.values(this.streams).find((stream) => stream.filePath === path)
  }

  updateStep(oldStep: Step, newStep: Step, options: { disableTypeCreation?: boolean } = {}): boolean {
    if (!this.isValidStep(newStep)) {
      this.deleteStep(oldStep)

      return false
    }

    if (oldStep.config.type !== newStep.config.type) {
      this.activeSteps = this.activeSteps.filter((s) => s.filePath !== oldStep.filePath)
      this.devSteps = this.devSteps.filter((s) => s.filePath !== oldStep.filePath)

      if (newStep.config.type === 'noop') {
        this.devSteps.push(newStep)
      } else {
        this.activeSteps.push(newStep)
      }
    }

    const savedStep = this.stepsMap[newStep.filePath]
    const addedFlows = newStep.config.flows?.filter((flowName) => !oldStep.config.flows?.includes(flowName)) ?? []
    const removedFlows = oldStep.config.flows?.filter((flowName) => !newStep.config.flows?.includes(flowName)) ?? []
    const untouchedFlows = oldStep.config.flows?.filter((flowName) => newStep.config.flows?.includes(flowName)) ?? []
    savedStep.config = newStep.config

    untouchedFlows.forEach((flowName) => this.onFlowUpdated(flowName))

    for (const flowName of addedFlows) {
      if (!this.flows[flowName]) {
        const flow = this.createFlow(flowName)
        flow.steps.push(savedStep)
      } else {
        this.flows[flowName].steps.push(savedStep)
        this.onFlowUpdated(flowName)
      }
    }

    for (const flowName of removedFlows) {
      const flowSteps = this.flows[flowName].steps
      this.flows[flowName].steps = flowSteps.filter(({ filePath }) => filePath !== newStep.filePath)

      if (this.flows[flowName].steps.length === 0) {
        this.removeFlow(flowName)
      } else {
        this.onFlowUpdated(flowName)
      }
    }

    if (!options.disableTypeCreation) {
      this.saveTypes()
    }

    this.stepHandlers['step-updated'].forEach((handler) => handler(newStep))
    this.printer.printStepUpdated(newStep)

    return true
  }

  createStep(step: Step, options: { disableTypeCreation?: boolean } = {}): boolean {
    if (!this.isValidStep(step)) {
      return false
    }

    this.stepsMap[step.filePath] = step

    if (step.config.type === 'noop') {
      this.devSteps.push(step)
    } else {
      this.activeSteps.push(step)
    }

    for (const flowName of step.config.flows ?? []) {
      if (!this.flows[flowName]) {
        const flow = this.createFlow(flowName)
        flow.steps.push(step)
      } else {
        this.flows[flowName].steps.push(step)
        this.onFlowUpdated(flowName)
      }
    }

    if (!options.disableTypeCreation) {
      this.saveTypes()
    }

    this.stepHandlers['step-created'].forEach((handler) => handler(step))
    this.printer.printStepCreated(step)

    return true
  }

  deleteStep(step: Step, options: { disableTypeCreation?: boolean } = {}): void {
    // Remove step from active and dev steps
    this.activeSteps = this.activeSteps.filter(({ filePath }) => filePath !== step.filePath)
    this.devSteps = this.devSteps.filter(({ filePath }) => filePath !== step.filePath)

    delete this.stepsMap[step.filePath]

    for (const flowName of step.config.flows ?? []) {
      const stepFlows = this.flows[flowName]?.steps

      if (stepFlows) {
        this.flows[flowName].steps = stepFlows.filter(({ filePath }) => filePath !== step.filePath)
      }

      if (this.flows[flowName].steps.length === 0) {
        this.removeFlow(flowName)
      } else {
        this.onFlowUpdated(flowName)
      }
    }

    if (!options.disableTypeCreation) {
      this.saveTypes()
    }

    this.stepHandlers['step-removed'].forEach((handler) => handler(step))
    this.printer.printStepRemoved(step)
  }

  private createFactoryWrapper<TData>(stream: Stream, factory: StreamFactory<TData>): StreamFactory<TData> {
    return () => {
      const streamFactory = this.streamWrapper //
        ? this.streamWrapper(stream.config.name, factory)
        : factory
      return streamFactory()
    }
  }

  createStream<TData>(
    baseStream: Omit<Stream, 'factory'>,
    options: { disableTypeCreation?: boolean } = {},
  ): StreamFactory<TData> {
    const stream = baseStream as Stream

    this.streams[stream.config.name] = stream
    this.streamHandlers['stream-created'].forEach((handler) => handler(stream))

    if (stream.config.baseConfig.storageType === 'default') {
      stream.factory = this.createFactoryWrapper(stream, () => this.createStreamAdapter(stream.config.name))
    } else {
      stream.factory = this.createFactoryWrapper(stream, stream.config.baseConfig.factory)
    }

    if (!stream.hidden) {
      this.printer.printStreamCreated(stream)

      if (!options.disableTypeCreation) {
        this.saveTypes()
      }
    }

    return stream.factory as StreamFactory<TData>
  }

  deleteStream(stream: Stream, options: { disableTypeCreation?: boolean } = {}): void {
    Object.entries(this.streams).forEach(([streamName, { filePath }]) => {
      if (stream.filePath === filePath) {
        delete this.streams[streamName]
      }
    })

    this.streamHandlers['stream-removed'].forEach((handler) => handler(stream))

    if (!stream.hidden) {
      this.printer.printStreamRemoved(stream)

      if (!options.disableTypeCreation) {
        this.saveTypes()
      }
    }
  }

  updateStream(oldStream: Stream, stream: Stream, options: { disableTypeCreation?: boolean } = {}): void {
    if (oldStream.config.name !== stream.config.name) {
      delete this.streams[oldStream.config.name]
    }

    if (stream.config.baseConfig.storageType === 'default') {
      stream.factory = this.createFactoryWrapper(stream, () => this.createStreamAdapter(stream.config.name))
    } else {
      stream.factory = this.createFactoryWrapper(stream, stream.config.baseConfig.factory)
    }

    this.streams[stream.config.name] = stream
    this.streamHandlers['stream-updated'].forEach((handler) => handler(stream))

    if (!stream.hidden) {
      this.printer.printStreamUpdated(stream)

      if (!options.disableTypeCreation) {
        this.saveTypes()
      }
    }
  }

  private createFlow(flowName: string): Flow {
    const flow = { name: flowName, description: '', steps: [] }
    this.flows[flowName] = flow
    this.handlers['flow-created'].forEach((handler) => handler(flowName))
    this.printer.printFlowCreated(flowName)

    return flow
  }

  private removeFlow(flowName: string): void {
    delete this.flows[flowName]
    this.handlers['flow-removed'].forEach((handler) => handler(flowName))
    this.printer.printFlowRemoved(flowName)
  }

  private onFlowUpdated(flowName: string): void {
    this.handlers['flow-updated'].forEach((handler) => handler(flowName))
  }

  private isValidStep(step: Step): boolean {
    const validationResult = validateStep(step)

    if (!validationResult.success) {
      this.printer.printValidationError(step.filePath, validationResult)
    }

    return validationResult.success
  }

  private createStreamAdapter<TData>(streamName: string): StreamAdapter<TData> {
    return this.streamAdapter.createStream<TData>(streamName)
  }
}
