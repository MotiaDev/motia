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

const baseTag = (tag: string) => colors.bold(colors.magenta(tag))
const streamTag = baseTag('Stream')
const stepTag = baseTag('Step')
const routerTag = baseTag('Router')

export class BuildPrinter {
  private readonly printer = new Printer(process.cwd())
  private readonly output = new CLIOutputManager()

  getLanguage(language: string) {
    if (language === 'python') {
      return colors.bold(colors.blue('Python'))
    } else if (language === 'node') {
      return colors.bold(colors.green('Node'))
    } else if (language === 'ruby') {
      return colors.bold(colors.red('Ruby'))
    }

    return colors.bold(colors.gray('Unknown'))
  }

  getStepLanguage(step: Step) {
    if (step.filePath.endsWith('.py')) {
      return this.getLanguage('python')
    } else if (step.filePath.endsWith('.js') || step.filePath.endsWith('.ts')) {
      return this.getLanguage('node')
    } else if (step.filePath.endsWith('.rb')) {
      return this.getLanguage('ruby')
    }

    return this.getLanguage('unknown')
  }

  printStepBuilding(step: Step, progressMessage?: string) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)

    this.output.log(step.filePath, (message) => {
      message.append(`${building} ${stepTag} ${stepLanguage} ${stepType} ${stepPath}`)

      if (progressMessage) {
        message.append(colors.yellow(progressMessage))
      }
    })
  }

  printStepBuilt(step: Step, size: number) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)

    this.output.log(step.filePath, (message) =>
      message
        .append(`${built} ${stepTag} ${stepLanguage} ${stepType} ${stepPath}`)
        .append(`${prettyBytes(size)}`, 'gray'),
    )
  }

  printApiRouterBuilding(language: string) {
    const fileName = `router-${language}.zip`
    const coloredFileName = colors.bold(colors.cyan(fileName))

    this.output.log(fileName, (message) =>
      message //
        .append(routerTag)
        .append(building)
        .append(this.getLanguage(language))
        .append(coloredFileName),
    )
  }

  printApiRouterBuilt(language: string, size: number) {
    const fileName = `router-${language}.zip`
    const coloredFileName = colors.bold(colors.cyan(fileName))

    this.output.log(fileName, (message) =>
      message
        .append(built)
        .append(routerTag)
        .append(this.getLanguage(language))
        .append(coloredFileName)
        .append(prettyBytes(size), 'gray'),
    )
  }

  printStepFailed(step: Step, error: Error) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)

    this.output.log(step.filePath, (message) =>
      message.append(`${failed} ${stepTag} ${stepLanguage} ${stepType} ${stepPath}`).append(error.message, 'red'),
    )
  }

  printStepSkipped(step: Step, reason: string) {
    const stepLanguage = this.getStepLanguage(step)
    const stepType = this.printer.getStepType(step)
    const stepPath = this.printer.getStepPath(step)

    this.output.log(step.filePath, (message) =>
      message.append(`${skipped} ${stepTag} ${stepLanguage} ${stepType} ${stepPath}`).append(reason, 'yellow'),
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
