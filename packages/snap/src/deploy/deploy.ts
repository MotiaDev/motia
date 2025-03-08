import colors from 'colors'
import { DeploymentResult, DeploymentConfig } from './types'
import { retrieveZipFiles, groupStepsByFlow, writeDeploymentResults } from './files'
import { uploadStepZip } from './upload'

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
 * Deploy all built steps to the API
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

  const zipFiles = retrieveZipFiles(projectDir)
  
  if (zipFiles.length === 0) {
    console.log(colors.yellow('⚠ [WARNING] '), 'No zip files found to deploy')
    return
  }
  
  console.log(colors.blue('ℹ [INFO] '), `Found ${zipFiles.length} zip files to deploy`)
  
  try {
    const deploymentConfig = loadDeploymentConfig(apiKey, environment, version)
    console.log(colors.blue('ℹ [INFO] '), `Deploying to environment: ${environment}, version: ${version}`)
    
    // Group steps by flow for better organization in logs
    const flowGroups = groupStepsByFlow(zipFiles)
    
    console.log(colors.blue('ℹ [INFO] '), `Deploying steps for ${Object.keys(flowGroups).length} flows`)
    
    const deploymentResults: DeploymentResult[] = []
    
    // Deploy each flow group
    for (const [flowName, flowSteps] of Object.entries(flowGroups)) {
      console.log(colors.blue('ℹ [INFO] '), `Deploying flow: ${flowName} (${flowSteps.length} steps)`)
      
      const flowResults = await Promise.all(
        flowSteps.map(async (zipFile) => {
          try {
            const deploymentId = await uploadStepZip(zipFile, deploymentConfig)
            
            return {
              bundlePath: zipFile.bundlePath,
              deploymentId,
              stepType: zipFile.config.type,
              stepName: zipFile.stepName,
              stepPath: zipFile.config.entrypointPath,
              flowName,
              stepConfig: zipFile.config.config,
              environment: deploymentConfig.environment,
              version: deploymentConfig.version,
              success: true
            } as DeploymentResult
          } catch (error) {
            console.error(colors.red('✗ [ERROR] '), `Failed to deploy ${zipFile.bundlePath}: ${error}`)
            return {
              bundlePath: zipFile.bundlePath,
              stepType: zipFile.config.type,
              stepName: zipFile.stepName,
              stepPath: zipFile.config.entrypointPath,
              flowName,
              environment: deploymentConfig.environment,
              version: deploymentConfig.version,
              error: error instanceof Error ? error.message : String(error),
              success: false
            } as DeploymentResult
          }
        })
      )
      
      deploymentResults.push(...flowResults)
    }
    
    const successCount = deploymentResults.filter(result => result.success).length
    
    if (successCount === zipFiles.length) {
      console.log(colors.green('✓ [SUCCESS] '), `Deployed ${successCount} of ${zipFiles.length} steps`)
    } else {
      console.log(
        colors.yellow('⚠ [WARNING] '), 
        `Deployed ${successCount} of ${zipFiles.length} steps. Some deployments failed.`
      )
    }
    
    // Write deployment results to files
    writeDeploymentResults(
      projectDir,
      deploymentResults,
      zipFiles,
      flowGroups,
      deploymentConfig.environment,
      deploymentConfig.version
    )
  } catch (error) {
    console.error(colors.red('✗ [ERROR] '), `Deployment failed: ${error}`)
    throw error
  }
}
