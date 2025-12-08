import { Printer } from '@motiadev/core'
import pc from 'picocolors'
import type { BuildStepConfig } from '../../build/builder'
import { CLIOutputManager, type Message } from '../../cli-output-manager'
import { projectDir } from '../constants'

const uploading = pc.yellow('➜ [UPLOADING]')
const uploaded = pc.green('✓ [UPLOADED]')

export class DeployPrinter {
  private readonly printer = new Printer(projectDir)
  private readonly output = new CLIOutputManager()

  getLanguage(language: string): string {
    if (language === 'node') {
      return pc.bold(pc.green('Node'))
    } else if (language === 'python') {
      return pc.bold(pc.blue('Python'))
    } else if (language === 'ruby') {
      return pc.bold(pc.red('Ruby'))
    }
    return pc.bold(pc.gray('Unknown'))
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
      return pc.gray('(API)')
    } else if (stepConfig.config.type === 'event') {
      return pc.gray('(Event)')
    } else if (stepConfig.config.type === 'cron') {
      return pc.gray('(Cron)')
    } else if (stepConfig.config.type === 'noop') {
      return pc.gray('(Noop)')
    }
    return pc.gray('(Unknown)')
  }

  getRelativePath(path: string): string {
    return pc.bold(pc.cyan(this.printer.getRelativePath(path)))
  }

  getStepPath(stepConfig: BuildStepConfig): string {
    return this.getRelativePath(stepConfig.filePath)
  }

  printStepUploading(stepConfig: BuildStepConfig): void {
    const stepLanguage = this.getStepLanguage(stepConfig)
    const stepType = this.getStepType(stepConfig)
    const stepPath = this.getStepPath(stepConfig)
    const stepTag = this.printer.stepTag

    this.output.log(stepConfig.filePath, (message: Message) => {
      message.append(`${uploading} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`)
    })
  }

  printStepUploaded(stepConfig: BuildStepConfig): void {
    const stepLanguage = this.getStepLanguage(stepConfig)
    const stepType = this.getStepType(stepConfig)
    const stepPath = this.getStepPath(stepConfig)
    const stepTag = this.printer.stepTag

    this.output.log(stepConfig.filePath, (message: Message) => {
      message.append(`${uploaded} ${stepLanguage} ${stepTag} ${stepType} ${stepPath}`)
    })
  }

  printRouterUploading(language: string, routerPath: string): void {
    const stepLanguage = this.getLanguage(language)
    const stepPath = this.getRelativePath(routerPath)

    this.output.log(routerPath, (message: Message) => message.append(`${uploading} ${stepLanguage} ${stepPath}`))
  }

  printRouterUploaded(language: string, routerPath: string): void {
    const stepLanguage = this.getLanguage(language)
    const stepPath = this.getRelativePath(routerPath)

    this.output.log(routerPath, (message: Message) => message.append(`${uploaded} ${stepLanguage} ${stepPath}`))
  }

  printConfigurationUploading(): void {
    this.output.log('upload-config', (message: Message) => message.tag('progress').append(`${uploading} Configuration`))
  }

  printConfigurationUploaded(): void {
    this.output.log('upload-config', (message: Message) => message.tag('success').append(`${uploaded} Configuration`))
  }
}
