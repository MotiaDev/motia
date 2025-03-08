import fs from 'fs'
import path from 'path'
import colors from 'colors'
import { StepsConfig, ZipFileInfo, DeploymentResult, DeploymentSummary } from './types'

/**
 * Retrieves all zip files generated during the build process
 * 
 * @param projectDir - The project directory (default: current working directory)
 * @returns Array of zip file information
 */
export const retrieveZipFiles = (projectDir: string = process.cwd()): ZipFileInfo[] => {
  const distDir = path.join(projectDir, 'dist')
  const stepsConfigPath = path.join(distDir, 'motia.steps.json')
  
  if (!fs.existsSync(stepsConfigPath)) {
    throw new Error('motia.steps.json not found. Please run the build command first.')
  }
  
  const stepsConfig: StepsConfig = JSON.parse(fs.readFileSync(stepsConfigPath, 'utf-8'))
  const zipFiles: ZipFileInfo[] = []
  
  for (const bundlePath in stepsConfig) {
    const zipPath = path.join(distDir, bundlePath)
    const stepConfig = stepsConfig[bundlePath]
    
    if (fs.existsSync(zipPath)) {
      const stepName = stepConfig.config.name || path.basename(bundlePath, '.zip')
      const flowNames = stepConfig.config.flows || []
      
      zipFiles.push({
        zipPath,
        bundlePath,
        config: stepConfig,
        stepName,
        flowNames
      })
    } else {
      console.warn(colors.yellow('⚠ [WARNING] '), `Zip file not found: ${zipPath}`)
    }
  }
  
  return zipFiles
}

/**
 * Group steps by flow for better organization
 * 
 * @param zipFiles - Array of zip file information
 * @returns Record of flow names to zip file arrays
 */
export const groupStepsByFlow = (zipFiles: ZipFileInfo[]): Record<string, ZipFileInfo[]> => {
  const flowGroups: Record<string, ZipFileInfo[]> = {}
  
  // Add steps to their respective flows
  zipFiles.forEach(zipFile => {
    if (zipFile.flowNames && zipFile.flowNames.length > 0) {
      zipFile.flowNames.forEach(flowName => {
        if (!flowGroups[flowName]) {
          flowGroups[flowName] = []
        }
        flowGroups[flowName].push(zipFile)
      })
    } else {
      // For steps without a flow, add to "unassigned" group
      if (!flowGroups['unassigned']) {
        flowGroups['unassigned'] = []
      }
      flowGroups['unassigned'].push(zipFile)
    }
  })
  
  return flowGroups
}

/**
 * Write deployment results to files
 * 
 * @param projectDir - The project directory
 * @param deploymentResults - Array of deployment results
 * @param zipFiles - Array of zip file information
 * @param flowGroups - Record of flow names to zip file arrays
 * @param environment - The deployment environment
 * @param version - The deployment version
 */
export const writeDeploymentResults = (
  projectDir: string,
  deploymentResults: DeploymentResult[],
  zipFiles: ZipFileInfo[],
  flowGroups: Record<string, ZipFileInfo[]>,
  environment: string,
  version: string
): void => {
  const successCount = deploymentResults.filter(result => result.success).length
  
  // Write detailed deployment results
  const deploymentResultsPath = path.join(projectDir, 'dist', 'motia.deployments.json')
  fs.writeFileSync(deploymentResultsPath, JSON.stringify(deploymentResults, null, 2))
  
  // Create a summary file with more readable format
  const summaryPath = path.join(projectDir, 'dist', 'motia.deployments.summary.json')
  const summary: DeploymentSummary = {
    totalSteps: zipFiles.length,
    successfulDeployments: successCount,
    failedDeployments: zipFiles.length - successCount,
    deploymentTime: new Date().toISOString(),
    environment,
    version,
    flows: Object.keys(flowGroups).map(flowName => ({
      name: flowName,
      steps: deploymentResults
        .filter(result => result.flowName === flowName)
        .map(result => ({
          name: result.stepName,
          type: result.stepType,
          path: result.stepPath,
          success: result.success,
          deploymentId: result.deploymentId,
          error: result.error
        }))
    }))
  }
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  console.log(colors.blue('ℹ [INFO] '), `Deployment summary written to ${summaryPath}`)
} 