import fs from 'fs'
import path from 'path'
import { DeploymentResult, DeploymentConfig } from './types'
import { FileService } from './files'
import { DeploymentService } from './upload'
import { logger } from './logger'
import { errorHandler, FailedUpload } from './error-handler'

export class DeploymentManager {
  async deploy(
    apiKey: string,
    projectDir: string = process.cwd(),
    environment: string = 'dev',
    version: string = 'latest'
  ): Promise<void> {
    if (!apiKey) {
      throw new Error('API key is required for deployment. Please provide an API key.')
    }

    const distDir = path.join(projectDir, 'dist')
    const stepsConfigPath = path.join(distDir, 'motia.steps.json')
    
    if (!fs.existsSync(stepsConfigPath)) {
      throw new Error('motia.steps.json not found. Please run the build command first.')
    }
    
    const stepsConfig = JSON.parse(fs.readFileSync(stepsConfigPath, 'utf-8'))
    const zipFiles = FileService.retrieveZipFiles(projectDir)
    
    if (zipFiles.length === 0) {
      logger.noZipFiles()
      return
    }
    
    logger.foundZipFiles(zipFiles.length)
    
    try {
      const deploymentConfig: DeploymentConfig = {
        apiKey,
        environment,
        version
      }
      
      logger.deployingToEnvironment(environment, version)
      
      const flowGroups = FileService.groupStepsByFlow(zipFiles)
      
      logger.deployingFlows(Object.keys(flowGroups).length)
      
      logger.uploadingZipFiles()
      
      let allUploadsSuccessful = true
      const uploadResults = []
      const failedUploads: FailedUpload[] = []
      
      for (const zipFile of zipFiles) {
        try {
          const relativePath = zipFile.bundlePath
          const uploadId = await DeploymentService.uploadZipFile(
            zipFile.zipPath, 
            relativePath, 
            apiKey, 
            environment, 
            version
          )
          
          uploadResults.push({
            bundlePath: zipFile.bundlePath,
            uploadId,
            stepType: zipFile.config.type,
            stepName: zipFile.stepName,
            success: true
          })
          
          logger.uploadSuccess(zipFile.bundlePath)
        } catch (error) {
          allUploadsSuccessful = false
          const errorMessage = errorHandler.formatError(error)
          
          logger.uploadFailed(zipFile.bundlePath, errorMessage)
          
          failedUploads.push({
            path: zipFile.bundlePath,
            name: zipFile.stepName,
            type: zipFile.config.type,
            error: errorMessage
          })
          
          uploadResults.push({
            bundlePath: zipFile.bundlePath,
            stepType: zipFile.config.type,
            stepName: zipFile.stepName,
            error: errorMessage,
            success: false
          })
        }
      }
      
      if (!allUploadsSuccessful) {
        errorHandler.handleUploadFailures(failedUploads, zipFiles.length)
        throw new Error('Deployment aborted due to upload failures')
      }
      
      logger.allZipFilesUploaded(zipFiles.length)
      
      let configId
      try {
        configId = await DeploymentService.uploadStepsConfig(stepsConfig, apiKey, environment, version)
        logger.configUploaded()
      } catch (error) {
        const errorMessage = errorHandler.formatError(error)
        errorHandler.handleConfigUploadFailure(errorMessage)
        throw new Error('Deployment aborted due to configuration upload failure')
      }
      
      let deploymentId
      try {
        const uploadIds = uploadResults.map(upload => upload.uploadId as string)
        deploymentId = await DeploymentService.startDeployment(uploadIds, configId, deploymentConfig)
        logger.deploymentStarted(deploymentId)
      } catch (error) {
        const errorMessage = errorHandler.formatError(error)
        errorHandler.handleDeploymentStartFailure(errorMessage)
        throw new Error('Deployment aborted due to start deployment failure')
      }
      
      const deploymentResults: DeploymentResult[] = uploadResults.map(result => ({
        bundlePath: result.bundlePath,
        deploymentId: result.success ? deploymentId : undefined,
        stepType: result.stepType,
        stepName: result.stepName,
        stepPath: stepsConfig[result.bundlePath]?.entrypointPath,
        flowName: stepsConfig[result.bundlePath]?.config?.flows?.[0] || 'unknown',
        environment: environment,
        version: version,
        error: result.error,
        success: result.success
      }))
      
      FileService.writeDeploymentResults(
        projectDir,
        deploymentResults,
        zipFiles,
        flowGroups,
        environment,
        version
      )
      
      logger.deploymentCompleted()
    } catch (error) {
      const errorMessage = errorHandler.formatError(error)
      errorHandler.handleGeneralDeploymentFailure(errorMessage)
      throw error
    }
  }
}
