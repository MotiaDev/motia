import path from 'path'
import pc from 'picocolors'
import type { ValidationError } from './step-validator'
import type { Step } from './types'
import type { Stream } from './types-stream'

const stepTag = pc.bold(pc.magenta('Step'))
const flowTag = pc.bold(pc.blue('Flow'))
const streamTag = pc.bold(pc.green('Stream'))
const registered = pc.green('➜ [REGISTERED]')
const building = pc.yellow('⚡ [BUILDING]')
const built = pc.green('✓ [BUILT]')
const updated = pc.yellow('➜ [UPDATED]')
const removed = pc.red('➜ [REMOVED]')
const error = pc.red('[ERROR]')
const warning = pc.yellow('[WARNING]')
const warnIcon = pc.yellow('⚠')
const infoIcon = pc.blue('ℹ')
const errorIcon = pc.red('✖')

export class Printer {
  constructor(private readonly baseDir: string) {}

  stepTag = stepTag
  flowTag = flowTag
  registered = registered
  building = building
  built = built
  updated = updated
  removed = removed

  printStepCreated(step: Step) {
    console.log(`${registered} ${stepTag} ${this.getStepPath(step)} registered`)
  }

  printStepUpdated(step: Step) {
    console.log(`${updated} ${stepTag} ${this.getStepPath(step)} updated`)
  }

  printStepRemoved(step: Step) {
    console.log(`${removed} ${stepTag} ${this.getStepPath(step)} removed`)
  }

  printFlowCreated(flowName: string) {
    console.log(`${registered} ${flowTag} ${pc.bold(pc.cyan(flowName))} registered`)
  }

  printFlowUpdated(flowName: string) {
    console.log(`${updated} ${flowTag} ${pc.bold(pc.cyan(flowName))} updated`)
  }

  printFlowRemoved(flowName: string) {
    console.log(`${removed} ${flowTag} ${pc.bold(pc.cyan(flowName))} removed`)
  }

  printStreamCreated(stream: Stream) {
    console.log(`${registered} ${streamTag} ${this.getStreamPath(stream)} registered`)
  }

  printStreamUpdated(stream: Stream) {
    console.log(`${updated} ${streamTag} ${this.getStreamPath(stream)} updated`)
  }

  printStreamRemoved(stream: Stream) {
    console.log(`${removed} ${streamTag} ${this.getStreamPath(stream)} removed`)
  }

  printInvalidSchema(topic: string, step: Step[]) {
    console.log(`${error} Topic ${pc.bold(pc.blue(topic))} has incompatible schemas in the following steps:`)
    step.forEach((step) => {
      console.log(`${pc.red('  ✖')} ${this.getStepPath(step)}`)
    })
  }

  printValidationError(stepPath: string, validationError: ValidationError) {
    const relativePath = this.getRelativePath(stepPath)

    console.log(`${error} ${pc.bold(pc.cyan(relativePath))}`)
    validationError.errors?.forEach((error) => {
      if (error.path) {
        console.log(`${pc.red('│')} ${pc.yellow(`✖ ${error.path}`)}: ${error.message}`)
      } else {
        console.log(`${pc.red('│')} ${pc.yellow('✖')} ${error.message}`)
      }
    })
    console.log(`${pc.red('└─')} ${pc.red(validationError.error)}  `)
  }

  getRelativePath(filePath: string) {
    return path.relative(this.baseDir, filePath)
  }

  getStepPath(step: Step) {
    const stepPath = this.getRelativePath(step.filePath)
    return pc.bold(pc.cyan(stepPath))
  }

  getStreamPath(stream: Stream) {
    const streamPath = this.getRelativePath(stream.filePath)
    return pc.bold(pc.magenta(streamPath))
  }

  printPluginLog(message: string) {
    const pluginTag = pc.bold(pc.cyan('[motia-plugins]'))
    console.log(`${infoIcon} ${pluginTag} ${message}`)
  }

  printPluginWarn(message: string) {
    const pluginTag = pc.bold(pc.cyan('[motia-plugins]'))
    console.warn(`${warnIcon} ${pluginTag} ${pc.yellow(message)}`)
  }

  printPluginError(message: string, ...args: unknown[]) {
    const pluginTag = pc.bold(pc.cyan('[motia-plugins]'))
    console.error(`${errorIcon} ${pluginTag} ${pc.red(message)}`, ...args)
  }
}
