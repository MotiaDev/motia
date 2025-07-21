import colors from 'colors'
import { Printer } from '@motiadev/core/dist/src/printer'
import { CLIOutputManager } from '../cli-output-manager'
import { BuildStepConfig } from '../build/builder'

const uploading = colors.yellow('➜ [UPLOADING]')
const uploaded = colors.green('✓ [UPLOADED]')

export class DeployPrinter {
  private readonly printer = new Printer(process.cwd())
  private readonly output = new CLIOutputManager()

  getLanguage(language: string): string {
    if (language === 'node') {
      return colors.bold(colors.green('Node'))
    } else if (language === 'python') {
      return colors.bold(colors.blue('Python'))
    } else if (language === 'ruby') {
      return colors.bold(colors.red('Ruby'))
    }
    return colors.bold(colors.gray('Unknown'))
  }

  getStepLanguage(stepConfig: BuildStepConfig): string {
    if (stepConfig.filePath.endsWith('.py')) {
      return this.getLanguage('python')
    } else if (stepConfig.filePath.endsWith('.js') || stepConfig.filePath.endsWith('.ts')) {
      return this.getLanguage('node')
    } else if (stepConfig.filePath.endsWith('.rb')) {
      return this.getLanguage('ruby')
    }
    return this.getLanguage('unknown')
  }

  getStepType(stepConfig: BuildStepConfig): string {
    if (stepConfig.config.type === 'api') {
      return colors.gray('(API)')
    } else if (stepConfig.config.type === 'event') {
      return colors.gray('(Event)')
    } else if (stepConfig.config.type === 'cron') {
      return colors.gray('(Cron)')
    } else if (stepConfig.config.type === 'noop') {
      return colors.gray('(Noop)')
    }
    return colors.gray('(Unknown)')
  }

  getRelativePath(path: string): string {
    return colors.bold(colors.cyan(this.printer.getRelativePath(path)))
  }

  getStepPath(stepConfig: BuildStepConfig): string {
    return this.getRelativePath(stepConfig.filePath)
  }

  printStepUploading(stepConfig: BuildStepConfig): void {
    const stepLanguage = this.getStepLanguage(stepConfig)
    const stepType = this.getStepType(stepConfig)
    const stepPath = this.getStepPath(stepConfig)
    const stepTag = this.printer.stepTag

    this.output.log(stepConfig.filePath, (message) => {
      message.append(`${uploading} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`)
    })
  }

  printStepUploaded(stepConfig: BuildStepConfig): void {
    const stepLanguage = this.getStepLanguage(stepConfig)
    const stepType = this.getStepType(stepConfig)
    const stepPath = this.getStepPath(stepConfig)
    const stepTag = this.printer.stepTag

    this.output.log(stepConfig.filePath, (message) => {
      message.append(`${uploaded} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`)
    })
  }

  printRouterUploading(language: string, routerPath: string): void {
    const stepLanguage = this.getLanguage(language)
    const stepPath = this.getRelativePath(routerPath)

    this.output.log(routerPath, (message) => message.append(`${uploading} ${stepLanguage} ${stepPath}`))
  }

  printRouterUploaded(language: string, routerPath: string): void {
    const stepLanguage = this.getLanguage(language)
    const stepPath = this.getRelativePath(routerPath)

    this.output.log(routerPath, (message) => message.append(`${uploaded} ${stepLanguage} ${stepPath}`))
  }

  printConfigurationUploading(): void {
    this.output.log('upload-config', (message) => message.tag('progress').append(`${uploading} Configuration`))
  }

  printConfigurationUploaded(): void {
    this.output.log('upload-config', (message) => message.tag('success').append(`${uploaded} Configuration`))
  }
}
