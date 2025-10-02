import colors from 'colors'
import path from 'path'
import { ValidationError } from './step-validator'
import { Step } from './types'
import { isApiStep, isCronStep, isEventStep, isNoopStep } from './guards'
import { Stream } from './types-stream'

const stepTag = colors.bold(colors.magenta('Step'))
const flowTag = colors.bold(colors.blue('Flow'))
const streamTag = colors.bold(colors.green('Stream'))
const registered = colors.green('➜ [REGISTERED]')
const building = colors.yellow('⚡ [BUILDING]')
const built = colors.green('✓ [BUILT]')
const updated = colors.yellow('➜ [UPDATED]')
const removed = colors.red('➜ [REMOVED]')
const invalidEmit = colors.red('➜ [INVALID EMIT]')
const error = colors.red('[ERROR]')
const warning = colors.yellow('[WARNING]')

export class Printer {
  constructor(private readonly baseDir: string) {}

  stepTag = stepTag
  flowTag = flowTag
  registered = registered
  building = building
  built = built
  updated = updated
  removed = removed

  printInvalidEmit(step: Step, emit: string) {
    console.log(
      `${invalidEmit} ${stepTag} ${this.getStepType(step)} ${this.getStepPath(step)} tried to emit an event not defined in the step config: ${colors.yellow(emit)}`,
    )
  }

  printStepCreated(step: Step) {
    console.log(`${registered} ${stepTag} ${this.getStepType(step)} ${this.getStepPath(step)} registered`)
  }

  printStepUpdated(step: Step) {
    console.log(`${updated} ${stepTag} ${this.getStepType(step)} ${this.getStepPath(step)} updated`)
  }

  printStepRemoved(step: Step) {
    console.log(`${removed} ${stepTag} ${this.getStepType(step)} ${this.getStepPath(step)} removed`)
  }

  printFlowCreated(flowName: string) {
    console.log(`${registered} ${flowTag} ${colors.bold(colors.cyan(flowName))} registered`)
  }

  printFlowUpdated(flowName: string) {
    console.log(`${updated} ${flowTag} ${colors.bold(colors.cyan(flowName))} updated`)
  }

  printFlowRemoved(flowName: string) {
    console.log(`${removed} ${flowTag} ${colors.bold(colors.cyan(flowName))} removed`)
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

  printInvalidEmitConfiguration(step: Step, emit: string) {
    console.log(
      `${warning} ${stepTag} ${this.getStepType(step)} ${this.getStepPath(step)} emits to ${colors.yellow(emit)}, but there is no subscriber defined`,
    )
  }

  printInvalidSchema(topic: string, step: Step[]) {
    console.log(`${error} Topic ${colors.bold(colors.blue(topic))} has incompatible schemas in the following steps:`)
    step.forEach((step) => {
      console.log(`${colors.red('  ✖')} ${this.getStepPath(step)}`)
    })
  }

  printValidationError(stepPath: string, validationError: ValidationError) {
    const relativePath = this.getRelativePath(stepPath)

    console.log(`${error} ${colors.bold(colors.cyan(relativePath))}`)
    validationError.errors?.forEach((error) => {
      if (error.path) {
        console.log(`${colors.red('│')} ${colors.yellow(`✖ ${error.path}`)}: ${error.message}`)
      } else {
        console.log(`${colors.red('│')} ${colors.yellow('✖')} ${error.message}`)
      }
    })
    console.log(`${colors.red('└─')} ${colors.red(validationError.error)}  `)
  }

  getRelativePath(filePath: string) {
    return path.relative(this.baseDir, filePath)
  }

  getStepType(step: Step) {
    if (isApiStep(step)) return colors.gray('(API)')
    if (isEventStep(step)) return colors.gray('(Event)')
    if (isCronStep(step)) return colors.gray('(Cron)')
    if (isNoopStep(step)) return colors.gray('(Noop)')

    return colors.gray('(Unknown)')
  }

  getStepPath(step: Step) {
    const stepPath = this.getRelativePath(step.filePath)
    return colors.bold(colors.cyan(stepPath))
  }

  getStreamPath(stream: Stream) {
    const streamPath = this.getRelativePath(stream.filePath)
    return colors.bold(colors.magenta(streamPath))
  }
}

export class NoPrinter extends Printer {
  constructor() {
    super('')
  }

  printInvalidEmit() {}
  printStepCreated() {}
  printStepUpdated() {}
  printStepRemoved() {}
  printFlowCreated() {}
  printFlowUpdated() {}
  printFlowRemoved() {}
  printStepType() {}
  printStepPath() {}

  printStreamCreated() {}
  printStreamUpdated() {}
  printStreamRemoved() {}
}
