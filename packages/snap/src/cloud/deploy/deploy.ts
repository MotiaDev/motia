import fs from 'fs'
import path from 'path'
import { CliContext } from '../config-utils'
import { VersionResult } from './types'
import { parseEnvFile } from './utils/env-parser'
import { BuildStepsConfig, BuildStreamsConfig } from '../build/builder'

export class VersionManager {
  async deploy(
    context: CliContext,
    projectDir: string = process.cwd(),
    versionName: string = 'latest',
    options: { environmentId?: string; projectId?: string; envFile?: string } = {},
  ): Promise<void> {
    const { config } = context
    const environmentId = options.environmentId ?? config?.selectedEnvironment
    const projectId = options.projectId ?? config?.id

    if (!projectId) {
      context.exitWithError('No project selected. Please select a project first using project select command.')
    } else if (!environmentId) {
      context.exitWithError(
        'No environment selected. Please select a environment first using environment select command.',
      )
    }

    const distDir = path.join(projectDir, 'dist')
    const stepsConfigPath = path.join(distDir, 'motia.steps.json')
    const streamsConfigPath = path.join(distDir, 'motia.streams.json')
    const environmentsClient = context.apiFactory.getEnvironmentsClient()
    const environment = await environmentsClient
      .getEnvironment(projectId, environmentId)
      .catch((error) => context.exitWithError('Failed to get environment', error))

    if (!fs.existsSync(stepsConfigPath)) {
      context.log('deploy-failed', (message) =>
        message
          .tag('failed')
          .append('Missing steps config', 'red')
          .box(['Make sure you are running this command in a motia project'], 'red'),
      )
      context.exit(1)
    }

    const stepsConfig: BuildStepsConfig = JSON.parse(fs.readFileSync(stepsConfigPath, 'utf-8'))
    const streamsConfig: BuildStreamsConfig = JSON.parse(fs.readFileSync(streamsConfigPath, 'utf-8'))

    context.log('deploy', (message) =>
      message
        .tag('progress')
        .append('Deploying to environment')
        .append(environment.name, 'dark')
        .append('version')
        .append(versionName, 'dark'),
    )

    const versionId = await context.versionService.uploadConfiguration(
      environment.id,
      versionName,
      stepsConfig,
      streamsConfig,
    )
    const uploadResult = await context.versionService.uploadZipFile(versionId, distDir)

    if (!uploadResult.success) {
      context.log('deploy-failed', (message) =>
        message
          .tag('failed')
          .append('Deployment failed')
          .append(uploadResult.error || 'Unknown error', 'red')
          .box(['Please check the steps config and try again or contact support'], 'red'),
      )
      context.exit(1)
    }

    const envData = loadEnvData(options.envFile, context)
    const version = await context.versionService.startVersion(versionId, envData)
    const versionStatus = await this.pollVersionStatus(context, versionId)

    if (!versionStatus.success) {
      context.log('deploy-failed', (message) =>
        message
          .tag('failed')
          .append('Deployment failed')
          .append(versionStatus.message, 'red')
          .box(['Please check the version status and try again or contact support'], 'red'),
      )
      context.exit(1)
    }

    const versionResults: VersionResult[] = [uploadResult].map((result) => ({
      bundlePath: result.bundlePath,
      versionId: result.success ? versionId : undefined,
      stepType: result.stepType,
      stepName: result.stepName,
      stepPath: stepsConfig[result.bundlePath]?.entrypointPath,
      flowName: stepsConfig[result.bundlePath]?.config?.flows?.[0] || 'unknown',
      environment: environment.name,
      version: versionName,
      error: result.error,
      success: result.success,
    }))

    const result = versionResults[0]
    const status = result.success ? 'SUCCESS' : 'FAILED'

    if (result.success) {
      context.log('deploy-result', (message) =>
        message.tag('success').append('Deployment process completed successfully'),
      )
    } else {
      context.log('deploy-result', (message) =>
        message
          .tag('failed')
          .append('Deployment failed. Please check the deployment status and try again or contact support', 'red')
          .box([result.error || 'Unknown error'], 'red'),
      )
    }

    context.log('deploy-output', (message) =>
      message.table(
        undefined,
        [
          ['Status', status],
          ['Environment', result.environment],
          ['Version', result.version],
          result.error ? ['Error', result.error] : [],
          ['URL', version.apiGatewayDomain || version.apiGatewayUrl],
        ].filter((array) => array.length > 0),
      ),
    )

    context.log('deploy-final-message', (message) =>
      message
        .tag('info')
        .append('To use the new version you must promote it using ')
        .append('motiacloud environment update --version <versionId>', 'dark')
        .append(' or access the https://motia.cloud to promote it'),
    )
  }

  private async pollVersionStatus(
    context: CliContext,
    versionId: string,
  ): Promise<{ success: boolean; message: string }> {
    context.log('deploy-progress', (message) => message.tag('progress').append('Version in progress...'))

    const MAX_ATTEMPTS = parseInt(process.env.MOTIACLOUD_DEPLOY_TIMEOUT || '60', 10)
    const POLLING_INTERVAL_MS = 10000
    const startTime = Date.now()

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const elapsedTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`

      context.log('deploy-progress', (message) =>
        message.tag('progress').append(`Checking version status... (Elapsed time: ${elapsedTime})`),
      )
      const status = await context.versionService.getVersionStatus(versionId)

      if (status.status === 'completed') {
        const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
        context.log('deploy-progress', (message) =>
          message.tag('success').append(`Version completed successfully in ${totalTime}`),
        )
        return { success: true, message: 'Version completed successfully' }
      }

      if (status.status === 'failed') {
        const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
        context.log('deploy-progress', (message) =>
          message.tag('failed').append(`Version failed after ${totalTime}: ${status.errorMessage || 'Unknown error'}`),
        )
        return { success: false, message: status.errorMessage || 'Unknown error' }
      }

      if (attempt < MAX_ATTEMPTS) {
        context.log('deploy-progress', (message) =>
          message.tag('progress').append('Version in progress... Elapsed time:').append(elapsedTime, 'dark'),
        )
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS))
      } else {
        const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
        context.log('deploy-progress', (message) =>
          message.tag('failed').append(`Version status check timed out after ${totalTime}`),
        )
        return { success: false, message: 'Version status check timed out' }
      }
    }

    return { success: false, message: 'Maximum polling attempts reached' }
  }
}

const loadEnvData = (envFile: string | undefined, context: CliContext): Record<string, string> => {
  context.log('load-env', (message) => message.tag('progress').append('Loading environment variables...'))

  if (!envFile) {
    context.log('load-env', (message) => message.tag('warning').append('No environment file provided'))
    return {}
  }

  if (!fs.existsSync(envFile)) {
    context.log('load-env', (message) =>
      message
        .tag('failed')
        .append('Environment file not found:')
        .append(envFile, 'red')
        .box(['Please check the environment file path and try again'], 'red'),
    )
    context.exit(1)
  }

  const data = parseEnvFile(envFile)

  context.log('load-env', (message) => {
    message.tag('success').append('Environment variables loaded from file')

    const boxText = Object.keys(data)
      .map((key) => `${key}=***`)
      .join('\n')

    return message.box([boxText], 'blue')
  })

  return data
}
