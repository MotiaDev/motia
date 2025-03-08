import fs from 'fs'
import path from 'path'
import colors from 'colors'
import { DeploymentResult, DeploymentConfig } from './types'
import { retrieveZipFiles, groupStepsByFlow, writeDeploymentResults } from './files'
import { uploadZipFile, uploadStepsConfig, startDeployment } from './upload'

/**
 * Load deployment configuration
 * 
 * @param apiKey - The API key for authentication (required)
 * @param environment - The deployment environment (default: 'dev')
 * @param version - The deployment version (default: 'latest')
 * @returns The deployment configuration
 */
export const loadDeploymentConfig = (
  apiKey: string,
  environment: string = 'dev', 
  version: string = 'latest'
): DeploymentConfig => {
  if (!apiKey) {
    throw new Error('API key is required for deployment. Please provide an API key.')
  }
  
  return {
    apiKey,
    environment,
    version
  }
}

/**
 * Deploy all built steps to the API using a three-step process:
 * 1. Upload all zip files
 * 2. Upload the steps configuration
 * 3. Start the deployment
 * 
 * @param apiKey - The API key for authentication (required)
 * @param projectDir - The project directory (default: current working directory)
 * @param environment - The deployment environment (default: 'dev')
 * @param version - The deployment version (default: 'latest')
 * @returns Promise that resolves when deployment is complete
 */
export const deploy = async (
  apiKey: string,
  projectDir: string = process.cwd(),
  environment: string = 'dev',
  version: string = 'latest'
): Promise<void> => {
  if (!apiKey) {
    throw new Error('API key is required for deployment. Please provide an API key.')
  }

  const distDir = path.join(projectDir, 'dist')
  const stepsConfigPath = path.join(distDir, 'motia.steps.json')
  
  if (!fs.existsSync(stepsConfigPath)) {
    throw new Error('motia.steps.json not found. Please run the build command first.')
  }
  
  const stepsConfig = JSON.parse(fs.readFileSync(stepsConfigPath, 'utf-8'))
  const zipFiles = retrieveZipFiles(projectDir)
  
  if (zipFiles.length === 0) {
    console.log(colors.yellow('⚠ [WARNING] '), 'No zip files found to deploy')
    return
  }
  
  console.log(colors.blue('ℹ [INFO] '), `Found ${zipFiles.length} zip files to deploy`)
  
  try {
    const deploymentConfig = loadDeploymentConfig(apiKey, environment, version)
    console.log(colors.blue('ℹ [INFO] '), `Deploying to environment: ${environment}, version: ${version}`)
    
    const flowGroups = groupStepsByFlow(zipFiles)
    
    console.log(colors.blue('ℹ [INFO] '), `Deploying steps for ${Object.keys(flowGroups).length} flows`)
    
    console.log(colors.blue('ℹ [INFO] '), 'Step 1: Uploading zip files')
    
    let allUploadsSuccessful = true
    const uploadResults = []
    
    for (const zipFile of zipFiles) {
      try {
        const relativePath = zipFile.bundlePath
        const uploadId = await uploadZipFile(
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
        
        console.log(colors.green('✓ [SUCCESS] '), `Uploaded ${zipFile.bundlePath}`)
      } catch (error) {
        allUploadsSuccessful = false
        console.error(colors.red('✗ [ERROR] '), `Failed to upload ${zipFile.bundlePath}: ${error}`)
        
        uploadResults.push({
          bundlePath: zipFile.bundlePath,
          stepType: zipFile.config.type,
          stepName: zipFile.stepName,
          error: error instanceof Error ? error.message : String(error),
          success: false
        })
      }
    }
    
    if (!allUploadsSuccessful) {
      throw new Error('Some files failed to upload. Deployment aborted.')
    }
    
    console.log(colors.green('✓ [SUCCESS] '), `All ${zipFiles.length} zip files uploaded successfully`)
    
    console.log(colors.blue('ℹ [INFO] '), 'Step 2: Uploading steps configuration')
    const configId = await uploadStepsConfig(stepsConfig, apiKey, environment, version)
    console.log(colors.green('✓ [SUCCESS] '), 'Steps configuration uploaded successfully')
    
    console.log(colors.blue('ℹ [INFO] '), 'Step 3: Starting deployment')
    const uploadIds = uploadResults.map(upload => upload.uploadId as string)
    const deploymentId = await startDeployment(uploadIds, configId, deploymentConfig)
    console.log(colors.green('✓ [SUCCESS] '), `Deployment started with ID: ${deploymentId}`)
    
    const deploymentResults: DeploymentResult[] = uploadResults.map(result => ({
      bundlePath: result.bundlePath,
      deploymentId: result.success ? deploymentId : undefined,
      stepType: result.stepType,
      stepName: result.stepName,
      stepPath: stepsConfig[result.bundlePath]?.entrypointPath,
      flowName: stepsConfig[result.bundlePath]?.config?.flows?.[0] || 'unknown',
      environment: deploymentConfig.environment,
      version: deploymentConfig.version,
      error: result.error,
      success: result.success
    }))
    
    writeDeploymentResults(
      projectDir,
      deploymentResults,
      zipFiles,
      flowGroups,
      deploymentConfig.environment,
      deploymentConfig.version
    )
    
    console.log(colors.green('✓ [SUCCESS] '), 'Deployment process completed successfully')
  } catch (error) {
    console.error(colors.red('✗ [ERROR] '), `Deployment failed: ${error}`)
    throw error
  }
}
