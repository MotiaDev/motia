import { Step } from '@motiadev/core'
import { Stream } from '@motiadev/core/dist/src/types-stream'
import colors from 'colors'
import { BuildStepConfig } from '../../build/builder'
import { BuildPrinter } from './build-printer'
import { CliContext } from '../../config-utils'
import { DeployPrinter } from './printer'
import { DeployData, DeploymentListener, DeploymentOutput, ValidationError } from './listener.types'
import { printDeploymentStatus } from './print-deployment-status'

export class CliListener implements DeploymentListener {
  private readonly printer: BuildPrinter
  private readonly deployPrinter = new DeployPrinter()

  constructor(private readonly context: CliContext) {
    this.printer = new BuildPrinter()
  }

  onBuildStart(step: Step) {
    this.printer.printStepBuilding(step)
  }
  onBuildProgress(step: Step, message: string) {
    this.printer.printStepBuilding(step, message)
  }
  onBuildEnd(step: Step, size: number) {
    this.printer.printStepBuilt(step, size)
  }
  onBuildError(step: Step, error: Error) {
    this.printer.printStepFailed(step, error)
  }
  onBuildSkip(step: Step, reason: string) {
    this.printer.printStepSkipped(step, reason)
  }
  onStreamCreated(stream: Stream) {
    this.printer.printStreamCreated(stream)
  }

  onApiRouterBuilding(language: string) {
    this.printer.printApiRouterBuilding(language)
  }
  onApiRouterBuilt(language: string, size: number) {
    this.printer.printApiRouterBuilt(language, size)
  }

  onWarning(id: string, warning: string) {
    this.context.log(id, (message) => message.tag('warning').append(warning))
  }

  onBuildWarning(warning: ValidationError) {
    this.context.log(`build-warnings-${warning.step.filePath}`, (message) => {
      message.tag('warning').append(warning.message)
    })
  }

  onBuildErrors(errors: ValidationError[]) {
    this.context.log('build-failed', (message) => {
      message.box(['Unable to deploy to Motia Cloud, please fix the following errors'], 'red')
    })

    const errorTag = colors.red('✗ [ERROR]')

    errors.map((error) => {
      const filePath = colors.gray(`[${error.relativePath}]`)
      this.context.log(`build-errors-${error.relativePath}`, (message) => {
        message.tag('failed').append(`${errorTag} ${filePath} ${error.message}`)
      })
    })

    this.context.log('build-failed-end', (message) => {
      message.append(colors.gray('\n--------------------------------\n'))
      message.tag('failed').append('Deployment canceled', 'red')
    })
  }

  stepUploadStart(_: string, step: BuildStepConfig) {
    this.deployPrinter.printStepUploading(step)
  }

  stepUploadEnd(_: string, step: BuildStepConfig) {
    this.deployPrinter.printStepUploaded(step)
  }

  routeUploadStart(path: string, language: string) {
    this.deployPrinter.printRouterUploading(path, language)
  }
  routeUploadEnd(path: string, language: string) {
    this.deployPrinter.printRouterUploaded(path, language)
  }

  onDeployStart() {
    this.context.log('deploy-progress', (message) => message.tag('progress').append('Version in progress...'))
  }

  onDeployProgress(data: DeployData) {
    printDeploymentStatus(data, this.context)
  }

  onDeployEnd({ output }: DeploymentOutput) {
    this.context.log('deploy-result', (message) =>
      message.tag('success').append('Deployment process completed successfully'),
    )

    this.context.log('deploy-output', (message) =>
      message.table(
        ['Field', 'Value'],
        Object.entries(output).map(([key, value]) => [key, value]),
      ),
    )
  }

  onDeployError(errorMessage: string) {
    this.context.log('deploy-result', (message) =>
      message
        .tag('failed')
        .append('Deployment failed. Please check the deployment status and try again or contact support', 'red')
        .box([errorMessage], 'red'),
    )
  }

  stepUploadProgress() {}
  routeUploadProgress() {}
  routeUploadError() {}
  stepUploadError() {}
}
