import { Step, MotiaStream } from '@motiadev/core'
import { Stream } from '@motiadev/core/dist/src/types-stream'
import { BuildStepConfig } from '../../build/builder'
import { DeploymentListener, DeployData, ValidationError } from './listener.types'
import { DeploymentData, DeploymentStreamManager, BuildOutput, UploadOutput } from '../streams/deployment-stream'

export class StreamingDeploymentListener implements DeploymentListener {
  private errors: ValidationError[] = []
  private warnings: ValidationError[] = []
  private streamManager: DeploymentStreamManager

  constructor(
    private deploymentId: string,
    deploymentStream: MotiaStream<DeploymentData>,
  ) {
    this.streamManager = new DeploymentStreamManager(deploymentStream)
  }

  private relativePath(path: string): string {
    return path.replace(`${process.cwd()}/`, '')
  }

  private getStepType(step: Step): 'event' | 'api' | 'cron' {
    if (step.config.type === 'api') return 'api'
    if (step.config.type === 'cron') return 'cron'
    return 'event'
  }

  private getLanguage(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.js')) return 'node'
    if (filePath.endsWith('.py')) return 'python'
    if (filePath.endsWith('.rb')) return 'ruby'
    return 'unknown'
  }

  private async updateStream(update: Partial<DeploymentData>) {
    const current = await this.streamManager.getDeployment(this.deploymentId)

    if (!current) {
      return
    }
    const mergedUpdate: Partial<DeploymentData> = {
      ...update,
    }

    await this.streamManager.updateDeployment(this.deploymentId, mergedUpdate)
  }

  getErrors(): ValidationError[] {
    return this.errors
  }

  // Build phase events
  async onBuildStart(step: Step) {
    const message = `Building step: ${step.config.name}`
    const buildOutput: BuildOutput = {
      packagePath: this.relativePath(step.filePath),
      language: this.getLanguage(step.filePath),
      status: 'building',
      type: this.getStepType(step),
    }

    await this.updateStream({
      phase: 'build',
      status: 'building',
      message,
    })
    await this.streamManager.updateBuildOutput(this.deploymentId, buildOutput)
  }

  async onBuildProgress(step: Step, message: string) {
    const logMessage = `${step.config.name}: ${message}`
    await this.updateStream({ message: logMessage })
  }

  async onBuildEnd(step: Step, size: number) {
    const message = `Built ${step.config.name} (${size} bytes)`
    const buildOutput: BuildOutput = {
      packagePath: this.relativePath(step.filePath),
      language: this.getLanguage(step.filePath),
      status: 'built',
      type: this.getStepType(step),
      size,
    }

    await this.updateStream({ message })
    await this.streamManager.updateBuildOutput(this.deploymentId, buildOutput)
  }

  async onBuildError(step: Step, error: Error) {
    const message = `Error building ${step.config.name}: ${error.message}`
    const buildOutput: BuildOutput = {
      packagePath: this.relativePath(step.filePath),
      language: this.getLanguage(step.filePath),
      status: 'error',
      type: this.getStepType(step),
      errorMessage: error.message,
    }

    await this.updateStream({
      status: 'failed',
      message,
      error: error.message,
    })
    await this.streamManager.updateBuildOutput(this.deploymentId, buildOutput)
  }

  async onBuildSkip(step: Step, reason: string) {
    const message = `Skipped ${step.config.name}: ${reason}`
    await this.updateStream({ message })
  }

  async onStreamCreated(stream: Stream) {
    const message = `Created stream: ${stream.config.name}`
    await this.updateStream({ message })
  }

  async onApiRouterBuilding(language: string) {
    const message = `Building API router for ${language}`
    await this.updateStream({ message })
  }

  async onApiRouterBuilt(language: string, size: number) {
    const message = `Built API router for ${language} (${size} bytes)`
    await this.updateStream({ message })
  }

  async onWarning(id: string, warning: string) {
    this.warnings.push({
      relativePath: id,
      message: warning,
      step: {} as ValidationError['step'],
    })
    await this.updateStream({
      message: `Warning: ${warning}`,
    })
  }

  async onBuildWarning(warning: ValidationError): Promise<void> {
    this.warnings.push(warning)
    await this.updateStream({
      message: `Build warning: ${warning.message}`,
    })
  }

  async onBuildErrors(errors: ValidationError[]): Promise<void> {
    this.errors.push(...errors)
    const errorMessage = `Build failed with ${errors.length} errors`
    await this.updateStream({
      status: 'failed',
      message: errorMessage,
      error: errors.map((error) => error.message).join('\n'),
    })
  }

  // Upload phase events
  async stepUploadStart(stepPath: string, step: BuildStepConfig) {
    const message = `Starting upload: ${step.config.name}`
    const uploadOutput: UploadOutput = {
      packagePath: this.relativePath(stepPath),
      language: this.getLanguage(step.filePath),
      status: 'uploading',
      type: step.config.type as 'event' | 'api' | 'cron',
      progress: 0,
    }

    await this.updateStream({
      phase: 'upload',
      status: 'uploading',
      message,
    })
    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  async stepUploadProgress(stepPath: string, step: BuildStepConfig, progress: number) {
    const uploadOutput: UploadOutput = {
      packagePath: stepPath,
      language: this.getLanguage(step.filePath),
      status: 'uploading',
      type: step.config.type as 'event' | 'api' | 'cron',
      progress,
    }

    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  async stepUploadEnd(stepPath: string, step: BuildStepConfig) {
    const uploadOutput: UploadOutput = {
      packagePath: this.relativePath(stepPath),
      language: this.getLanguage(step.filePath),
      status: 'uploaded',
      type: step.config.type as 'event' | 'api' | 'cron',
      progress: 100,
    }

    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  async stepUploadError(stepPath: string, step: BuildStepConfig) {
    const message = `Upload failed: ${step.config.name}`
    const uploadOutput: UploadOutput = {
      packagePath: this.relativePath(stepPath),
      language: this.getLanguage(step.filePath),
      status: 'error',
      type: step.config.type as 'event' | 'api' | 'cron',
      errorMessage: message,
    }

    await this.updateStream({
      status: 'failed',
      message,
      error: message,
    })
    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  async routeUploadStart(path: string, language: string) {
    const uploadOutput: UploadOutput = {
      packagePath: this.relativePath(path),
      language,
      status: 'uploading',
      type: 'api',
      progress: 0,
    }

    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  async routeUploadProgress(path: string, language: string, progress: number) {
    const uploadOutput: UploadOutput = {
      packagePath: this.relativePath(path),
      language,
      status: 'uploading',
      type: 'api',
      progress,
    }

    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  async routeUploadEnd(path: string, language: string) {
    const message = `Uploaded: ${language} router`
    const uploadOutput: UploadOutput = {
      packagePath: this.relativePath(path),
      language,
      status: 'uploaded',
      type: 'api',
      progress: 100,
    }

    await this.updateStream({ message })
    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  async routeUploadError(path: string, language: string) {
    const message = `Upload failed: ${language} router`
    const uploadOutput: UploadOutput = {
      packagePath: this.relativePath(path),
      language,
      status: 'error',
      type: 'api',
      errorMessage: message,
    }

    await this.updateStream({
      status: 'failed',
      message,
      error: message,
    })
    await this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  // Deploy phase events
  async onDeployStart() {
    const message = 'Deployment started'
    await this.updateStream({
      phase: 'deploy',
      status: 'deploying',
      message,
    })
  }

  async onDeployProgress(data: DeployData) {
    const message = `Deployment status: ${data.status}`
    await this.updateStream({
      message,
    })
  }

  async onDeployEnd(): Promise<void> {
    await this.streamManager.completeDeployment(this.deploymentId)
  }

  async onDeployError(errorMessage: string): Promise<void> {
    await this.streamManager.completeDeployment(this.deploymentId, errorMessage)
  }

  // Utility methods for phase management
  async startBuildPhase() {
    await this.updateStream({
      phase: 'build',
      status: 'building',
      message: 'Build phase started',
    })
  }

  async startUploadPhase() {
    await this.updateStream({
      phase: 'upload',
      status: 'uploading',
      message: 'Upload phase started',
    })
  }

  async startDeployPhase() {
    await this.updateStream({
      phase: 'deploy',
      status: 'deploying',
      message: 'Deploy phase started',
    })
  }
}
