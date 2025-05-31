import { Step } from '@motiadev/core'
import { Printer } from '@motiadev/core/dist/src/printer'
import { Stream } from '@motiadev/core/dist/src/types-stream'
import { CLIOutputManager } from '../cli-output-manager'
import colors from 'colors'
import { prettyBytes } from './pretty-bytes'

const building = colors.yellow('➜ [BUILDING]')
const built = colors.green('✓ [BUILT]')
const failed = colors.red('✘ [FAILED]')
const skipped = colors.gray('- [SKIPPED]')

const streamTag = colors.blue('Stream')

export class BuildPrinter {
  private readonly printer = new Printer(process.cwd())
  private readonly output = new CLIOutputManager()

  getStepLanguage(step: Step) {
    if (step.filePath.endsWith('.py')) {
      return colors.bold(colors.blue('Python'))
    } else if (step.filePath.endsWith('.js') || step.filePath.endsWith('.ts')) {
      return colors.bold(colors.green('Node'))
    } else if (step.filePath.endsWith('.rb')) {
      return colors.bold(colors.red('Ruby'))
    }

    return colors.bold(colors.gray('Unknown'))
  }

  printStepBuilding(step: Step, progressMessage?: string) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)
    const stepTag = this.printer.stepTag

    this.output.log(step.filePath, (message) => {
      message.append(`${building} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`)

      if (progressMessage) {
        message.append(colors.yellow(progressMessage))
      }
    })
  }

  printStepBuilt(step: Step, size: number) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)
    const stepTag = this.printer.stepTag

    this.output.log(step.filePath, (message) =>
      message
        .append(`${built} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`)
        .append(`${prettyBytes(size)}`, 'gray'),
    )
  }

  printStepFailed(step: Step, error: Error) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)
    const stepTag = this.printer.stepTag

    this.output.log(step.filePath, (message) =>
      message.append(`${failed} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`).append(error.message, 'red'),
    )
  }

  printStepSkipped(step: Step, reason: string) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)
    const stepTag = this.printer.stepTag

    this.output.log(step.filePath, (message) =>
      message.append(`${skipped} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`).append(reason, 'yellow'),
    )
  }

  printStreamCreated(stream: Stream) {
    const streamPath = this.getStreamPath(stream)
    const streamName = colors.gray(`[${stream.config.name}]`)

    this.output.log(stream.filePath, (message) => message.append(`${built} ${streamTag} ${streamName} ${streamPath}`))
  }

  getStreamPath(stream: Stream) {
    return colors.bold(colors.cyan(this.printer.getRelativePath(stream.filePath)))
  }
}
