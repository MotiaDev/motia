import fs from 'fs'
import path from 'path'
import { StepsConfig, ZipFileInfo, DeploymentResult, DeploymentSummary } from './types'
import { logger } from './logger'

export class FileService {
  static retrieveZipFiles(projectDir: string = process.cwd()): ZipFileInfo[] {
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
        logger.warning(`Zip file not found: ${zipPath}`)
      }
    }
    
    return zipFiles
  }

  static groupStepsByFlow(zipFiles: ZipFileInfo[]): Record<string, ZipFileInfo[]> {
    const flowGroups: Record<string, ZipFileInfo[]> = {}
    
    zipFiles.forEach(zipFile => {
      if (zipFile.flowNames && zipFile.flowNames.length > 0) {
        zipFile.flowNames.forEach(flowName => {
          if (!flowGroups[flowName]) {
            flowGroups[flowName] = []
          }
          flowGroups[flowName].push(zipFile)
        })
      } else {
        if (!flowGroups['unassigned']) {
          flowGroups['unassigned'] = []
        }
        flowGroups['unassigned'].push(zipFile)
      }
    })
    
    return flowGroups
  }

  static writeDeploymentResults(
    projectDir: string,
    deploymentResults: DeploymentResult[],
    zipFiles: ZipFileInfo[],
    flowGroups: Record<string, ZipFileInfo[]>,
    environment: string,
    version: string
  ): void {
    const successCount = deploymentResults.filter(result => result.success).length
    
    const deploymentResultsPath = path.join(projectDir, 'dist', 'motia.deployments.json')
    fs.writeFileSync(deploymentResultsPath, JSON.stringify(deploymentResults, null, 2))
    
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
    logger.summaryWritten(summaryPath)
  }
} 