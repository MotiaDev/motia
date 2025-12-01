import type { Step } from '@motiadev/core'
import { Printer } from '@motiadev/core/dist/src/printer'
import type { Stream } from '@motiadev/core/dist/src/types-stream'
import pc from 'picocolors'
import { CLIOutputManager } from '../../cli-output-manager'
import { prettyBytes } from '../utils/pretty-bytes'

const building = pc.yellow('➜ [BUILDING]')
const built = pc.green('✓ [BUILT]')
const failed = pc.red('✘ [FAILED]')
const skipped = pc.gray('- [SKIPPED]')

const baseTag = (tag: string) => pc.bold(pc.magenta(tag))
const streamTag = baseTag('Stream')
const stepTag = baseTag('Step')
const routerTag = baseTag('Router')

export class BuildPrinter {
  private readonly printer = new Printer(process.cwd())
  private readonly output = new CLIOutputManager()

  getLanguage(language: string) {
    if (language === 'python') {
      return pc.bold(pc.blue('Python'))
    } else if (language === 'node') {
      return pc.bold(pc.green('Node'))
    } else if (language === 'ruby') {
      return pc.bold(pc.red('Ruby'))
    }

    return pc.bold(pc.gray('Unknown'))
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
        message.append(pc.yellow(progressMessage))
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
    const coloredFileName = pc.bold(pc.cyan(fileName))

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
    const coloredFileName = pc.bold(pc.cyan(fileName))

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
    const streamName = pc.gray(`[${stream.config.name}]`)

    this.output.log(stream.filePath, (message) => message.append(`${built} ${streamTag} ${streamName} ${streamPath}`))
  }

  getStreamPath(stream: Stream) {
    return pc.bold(pc.cyan(this.printer.getRelativePath(stream.filePath)))
  }
}
