import path from 'path'
import { VersionsClient } from '../../api'
import { VersionStartResponse } from '../../api/models/responses/version-responses'
import { StepsConfigFile } from '../../build/builder'
import { CliContext } from '../../config-utils'
import { DeployPrinter } from '../printer'
import { UploadResult } from '../types'

export class VersionService {
  private readonly versionClient: VersionsClient
  private readonly printer = new DeployPrinter()

  constructor(private readonly context: CliContext) {
    this.versionClient = context.apiFactory.getVersionsClient()
  }

  async uploadConfiguration(
    environmentId: string,
    motiaVersion: string,
    version: string,
    config: StepsConfigFile,
  ): Promise<string> {
    this.printer.printConfigurationUploading()
    const versionId = await this.versionClient.uploadStepsConfig(environmentId, motiaVersion, version, config)
    this.printer.printConfigurationUploaded()
    this.context.log('deploy', (message) => message.tag('success').append(`Version started with ID: ${versionId}`))

    return versionId
  }

  async uploadProject(versionId: string, distDir: string, config: StepsConfigFile): Promise<UploadResult> {
    try {
      const stepEntries = Object.entries(config.steps)

      await Promise.all(
        stepEntries.map(async ([stepPath, stepConfig]) => {
          this.printer.printStepUploading(stepConfig)
          const stepZipPath = path.join(distDir, stepPath)
          await this.versionClient.uploadZipFile(stepZipPath, versionId, stepPath)
          this.printer.printStepUploaded(stepConfig)
        }),
      )

      const routerEntries = Object.entries(config.routers)

      await Promise.all(
        routerEntries.map(async ([language, routerPath]) => {
          this.printer.printRouterUploading(language, routerPath)
          const routerZipPath = path.join(distDir, routerPath)
          await this.versionClient.uploadZipFile(routerZipPath, versionId, routerPath)
          this.printer.printRouterUploaded(language, routerPath)
        }),
      )

      return {
        success: true,
        bundlePath: distDir,
      }
    } catch (error) {
      this.context.log('upload-zip', (message) => message.tag('failed').append('Failed to upload bundle'))
      throw error
    }
  }

  async startVersion(versionId: string, envData?: Record<string, string>): Promise<VersionStartResponse> {
    this.context.log('deploy-progress', (message) => message.tag('progress').append('Finalizing version...'))
    return this.versionClient.startVersion(versionId, envData)
  }

  async getVersionStatus(versionId: string): Promise<{ status: string; errorMessage?: string; output?: string }> {
    return await this.versionClient.getVersionStatus(versionId)
  }

  async promoteVersion(args: { environmentId: string; versionName: string; projectId: string }): Promise<void> {
    const { environmentId, versionName, projectId } = args
    const environmentsClient = this.context.apiFactory.getEnvironmentsClient()
    const environment = await environmentsClient.getEnvironment(projectId, environmentId)

    this.context.log('promote-version', (message) =>
      message
        .tag('progress')
        .append('Promoting version')
        .append(versionName, 'dark')
        .append('to')
        .append(environment.name, 'dark'),
    )
    await this.versionClient.promoteVersion(environmentId, versionName)

    this.context.log('promote-version', (message) =>
      message
        .tag('success')
        .append('Version')
        .append(versionName, 'dark')
        .append('promoted successfully to')
        .append(environment.name, 'dark'),
    )
  }
}
