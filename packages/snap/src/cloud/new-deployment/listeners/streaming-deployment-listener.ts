import { Step, MotiaStream } from '@motiadev/core'
import { Stream } from '@motiadev/core/dist/src/types-stream'
import { BuildStepConfig } from '../../build/builder'
import { ValidationError } from '../../build/build-validation'
import { DeploymentListener, DeployData } from './listener.types'
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
  onBuildStart(step: Step) {
    const message = `Building step: ${step.config.name}`
    const buildOutput: BuildOutput = {
      packagePath: step.filePath,
      language: this.getLanguage(step.filePath),
      status: 'building',
      type: this.getStepType(step),
    }

    this.updateStream({
      phase: 'build',
      status: 'building',
      message,
      progress: 0,
    })
    this.streamManager.updateBuildOutput(this.deploymentId, buildOutput)
  }

  onBuildProgress(step: Step, message: string) {
    const logMessage = `${step.config.name}: ${message}`
    this.updateStream({
      message: logMessage,
      progress: 25,
    })
  }

  onBuildEnd(step: Step, size: number) {
    const message = `Built ${step.config.name} (${size} bytes)`
    const buildOutput: BuildOutput = {
      packagePath: step.filePath,
      language: this.getLanguage(step.filePath),
      status: 'built',
      type: this.getStepType(step),
      size,
    }

    this.updateStream({
      message,
      progress: 50,
    })
    this.streamManager.updateBuildOutput(this.deploymentId, buildOutput)
  }

  onBuildError(step: Step, error: Error) {
    const message = `Error building ${step.config.name}: ${error.message}`
    const buildOutput: BuildOutput = {
      packagePath: step.filePath,
      language: this.getLanguage(step.filePath),
      status: 'error',
      type: this.getStepType(step),
      errorMessage: error.message,
    }

    this.updateStream({
      status: 'failed',
      message,
      error: error.message,
    })
    this.streamManager.updateBuildOutput(this.deploymentId, buildOutput)
    }

  onBuildSkip(step: Step, reason: string) {
    const message = `Skipped ${step.config.name}: ${reason}`
    this.updateStream({
      message,
      progress: 10,
    })
  }

  onStreamCreated(stream: Stream) {
    const message = `Created stream: ${stream.config.name}`
    this.updateStream({
      message,
      progress: 20,
    })
  }

  onApiRouterBuilding(language: string) {
    const message = `Building API router for ${language}`
    this.updateStream({
      message,
      progress: 60,
    })
  }

  onApiRouterBuilt(language: string, size: number) {
    const message = `Built API router for ${language} (${size} bytes)`
    this.updateStream({
      message,
      progress: 80,
    })
  }

  onWarning(id: string, warning: string) {
    this.warnings.push({
      relativePath: id,
      message: warning,
      step: {} as ValidationError['step'],
    })
    this.updateStream({
      message: `Warning: ${warning}`,
      progress: 10,
    })
  }

  async onBuildWarning(warning: ValidationError): Promise<void> {
    this.warnings.push(warning)
    await this.updateStream({
      message: `Build warning: ${warning.message}`,
      progress: 10,
    })
  }

  async onBuildErrors(errors: ValidationError[]): Promise<void> {
    this.errors.push(...errors)
    const errorMessage = `Build failed with ${errors.length} errors`
    await this.updateStream({
      status: 'failed',
      message: errorMessage,
      error: errorMessage,
    })
  }

  // Upload phase events
  stepUploadStart(stepPath: string, step: BuildStepConfig) {
    const message = `Starting upload: ${step.config.name}`
    const uploadOutput: UploadOutput = {
      packagePath: stepPath,
      language: this.getLanguage(step.filePath),
      status: 'uploading',
      type: step.config.type as 'event' | 'api' | 'cron',
      progress: 0,
    }

    this.updateStream({
      phase: 'upload',
      status: 'uploading',
      message,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  stepUploadProgress(stepPath: string, step: BuildStepConfig, progress: number) {
    const message = `Uploading ${step.config.name}: ${progress}%`
    const uploadOutput: UploadOutput = {
      packagePath: stepPath,
      language: this.getLanguage(step.filePath),
      status: 'uploading',
      type: step.config.type as 'event' | 'api' | 'cron',
      progress,
    }

    this.updateStream({
      message,
      progress,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  stepUploadEnd(stepPath: string, step: BuildStepConfig) {
    const message = `Uploaded: ${step.config.name}`
    const uploadOutput: UploadOutput = {
      packagePath: stepPath,
      language: this.getLanguage(step.filePath),
      status: 'uploaded',
      type: step.config.type as 'event' | 'api' | 'cron',
      progress: 100,
    }

    this.updateStream({
      message,
      progress: 100,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  stepUploadError(stepPath: string, step: BuildStepConfig) {
    const message = `Upload failed: ${step.config.name}`
    const uploadOutput: UploadOutput = {
      packagePath: stepPath,
      language: this.getLanguage(step.filePath),
      status: 'error',
      type: step.config.type as 'event' | 'api' | 'cron',
      errorMessage: message,
    }

    this.updateStream({
      status: 'failed',
      message,
      error: message,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  routeUploadStart(path: string, language: string) {
    const message = `Starting upload: ${language} router`
    const uploadOutput: UploadOutput = {
      packagePath: path,
      language,
      status: 'uploading',
      type: 'api',
      progress: 0,
    }

    this.updateStream({
      message,
      progress: 50,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  routeUploadProgress(path: string, language: string, progress: number) {
    const message = `Uploading ${language} router: ${progress}%`
    const uploadOutput: UploadOutput = {
      packagePath: path,
      language,
      status: 'uploading',
      type: 'api',
      progress,
    }

    this.updateStream({
      message,
      progress,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  routeUploadEnd(path: string, language: string) {
    const message = `Uploaded: ${language} router`
    const uploadOutput: UploadOutput = {
      packagePath: path,
      language,
      status: 'uploaded',
      type: 'api',
      progress: 100,
    }

    this.updateStream({
      message,
      progress: 100,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  routeUploadError(path: string, language: string) {
    const message = `Upload failed: ${language} router`
    const uploadOutput: UploadOutput = {
      packagePath: path,
      language,
      status: 'error',
      type: 'api',
      errorMessage: message,
    }

    this.updateStream({
      status: 'failed',
      message,
      error: message,
    })
    this.streamManager.updateUploadOutput(this.deploymentId, uploadOutput)
  }

  // Deploy phase events
  onDeployStart() {
    const message = 'Deployment started'
    this.updateStream({
      phase: 'deploy',
      status: 'deploying',
      message,
    })
  }

  onDeployProgress(data: DeployData) {
    const message = `Deployment status: ${data.status}`
    this.updateStream({
      message,
      progress: 50,
    })
  }

  async onDeployEnd(): Promise<void> {
    await this.streamManager.completeDeployment(this.deploymentId, true)
  }

  async onDeployError(errorMessage: string): Promise<void> {
    await this.streamManager.completeDeployment(this.deploymentId, false, errorMessage)
  }

  // Utility methods for phase management
  async startBuildPhase() {
    await this.updateStream({
      phase: 'build',
      status: 'building',
      message: 'Build phase started',
    })
  }

  async completeBuildPhase() {
    await this.updateStream({
      message: 'Build phase completed',
      progress: 100,
    })
  }

  async startUploadPhase() {
    await this.updateStream({
      phase: 'upload',
      status: 'uploading',
      message: 'Upload phase started',
      progress: 0,
    })
  }

  async completeUploadPhase() {
    await this.updateStream({
      message: 'Upload phase completed',
      progress: 100,
    })
  }

  async startDeployPhase() {
    await this.updateStream({
      phase: 'deploy',
      status: 'deploying',
      message: 'Deploy phase started',
      progress: 0,
    })
  }
}
