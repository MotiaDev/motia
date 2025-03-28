import fs from 'fs'
import path from 'path'
import { DeploymentResult } from './types'
import { logger } from './logger'
import { GenericDeploymentError, MissingApiKeyError, MissingStepsConfigError } from './error'
import { DeploymentService } from './services/deployment-service'
import { getSelectedStage, getStage } from '../config-utils'
import { parseEnvFile } from './utils/env-parser'

export class DeploymentManager {
  async deploy(
    apiKey: string,
    projectDir: string = process.cwd(),
    version: string = 'latest',
    options: { stage?: string; envFile?: string } = {},
  ): Promise<void> {
    const deploymentService = new DeploymentService(apiKey)

    const stage = options.stage ? getStage(options.stage) : getSelectedStage()

    if (!stage) {
      throw new Error(options.stage ? `Stage "${options.stage}" not found` : 'No stage selected')
    }

    if (!apiKey) {
      throw new MissingApiKeyError()
    }

    const distDir = path.join(projectDir, 'dist')
    const stepsConfigPath = path.join(distDir, 'motia.steps.json')

    if (!fs.existsSync(stepsConfigPath)) {
      throw new MissingStepsConfigError()
    }

    const stepsConfig = JSON.parse(fs.readFileSync(stepsConfigPath, 'utf-8'))

    logger.info(`Deploying to environment: ${stage?.name}, version: ${version}`)

    const deploymentId = await deploymentService.uploadConfiguration(stepsConfig, stage.id, version)

    const uploadResult = await deploymentService.uploadZipFile(deploymentId, distDir)

    if (!uploadResult.success) {
      throw new GenericDeploymentError(
        new Error(`Deployment aborted due to ${uploadResult.error}`),
        'UPLOAD_FAILURES',
        `Deployment aborted due to ${uploadResult.error}`,
      )
    }

    const envData = loadEnvData(options.envFile)

    const deployment = await deploymentService.startDeployment(deploymentId, envData)

    const deploymentStatus = await this.pollDeploymentStatus(deploymentService, deploymentId)

    if (!deploymentStatus.success) {
      throw new GenericDeploymentError(
        new Error(`Deployment failed: ${deploymentStatus.message}`),
        'DEPLOYMENT_FAILED',
        `Deployment failed: ${deploymentStatus.message}`,
      )
    }

    const deploymentResults: DeploymentResult[] = [uploadResult].map((result) => ({
      bundlePath: result.bundlePath,
      deploymentId: result.success ? deploymentId : undefined,
      stepType: result.stepType,
      stepName: result.stepName,
      stepPath: stepsConfig[result.bundlePath]?.entrypointPath,
      flowName: stepsConfig[result.bundlePath]?.config?.flows?.[0] || 'unknown',
      environment: stage.name,
      version: version,
      error: result.error,
      success: result.success,
    }))

    const result = deploymentResults[0]
    const status = result.success ? 'SUCCESS' : 'FAILED'
    logger.info(`Deployment Result:
    Status: ${status}
    Environment: ${result.environment}
    Version: ${result.version}${result.error ? `\n    Error: ${result.error}` : ''}
    Api Gateway: ${deployment.apiGatewayUrl}`)

    logger.success('Deployment process completed successfully')
  }

  private async pollDeploymentStatus(
    deploymentService: DeploymentService,
    deploymentId: string,
  ): Promise<{ success: boolean; message: string }> {
    logger.info('Starting deployment status polling...')

    const MAX_ATTEMPTS = 30
    const POLLING_INTERVAL_MS = 10000
    const startTime = Date.now()

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const elapsedTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`

      logger.info(`Checking deployment status... (Elapsed time: ${elapsedTime})`)
      const status = await deploymentService.getDeploymentStatus(deploymentId)

      if (status.status === 'completed') {
        const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
        logger.success(`Deployment completed successfully in ${totalTime}`)
        return { success: true, message: 'Deployment completed successfully' }
      }

      if (status.status === 'failed') {
        const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
        logger.error(`Deployment failed after ${totalTime}: ${status.errorMessage || 'Unknown error'}`)
        return { success: false, message: status.errorMessage || 'Unknown error' }
      }

      if (attempt < MAX_ATTEMPTS) {
        logger.info(
          `Deployment in progress (${status.status})... (Elapsed time: ${elapsedTime}) - Checking again in 10 seconds`,
        )
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS))
      } else {
        const totalTime = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
        logger.warning(`Deployment status check timed out after ${totalTime}`)
        return { success: false, message: 'Deployment status check timed out' }
      }
    }

    return { success: false, message: 'Maximum polling attempts reached' }
  }
}

const loadEnvData = (envFile: string | undefined): Record<string, string> => {
  if (!envFile) {
    return {}
  }
  if (!fs.existsSync(envFile)) {
    throw new Error(`Environment file not found: ${envFile}`)
  }
  const data = parseEnvFile(envFile)
  logger.info('Environment variables loaded from file')
  return data
}
