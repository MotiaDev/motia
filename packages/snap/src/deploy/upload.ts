import fs from 'fs'
import path from 'path'
import colors from 'colors'
import axios from 'axios'
import FormData from 'form-data'
import { StepConfig, DeploymentConfig, ZipFileInfo } from './types'

// Fixed API URL for deployments
// export const API_URL = 'https://api.motiadev.com/deploy'
export const API_URL = 'https://4fa0-177-37-173-171.ngrok-free.app/deploy'

/**
 * Upload a zip file to the API endpoint
 * 
 * @param zipPath - Path to the zip file
 * @param bundlePath - Path to the bundle
 * @param config - Step configuration
 * @param deploymentConfig - Deployment configuration
 * @param stepName - Name of the step
 * @param flowNames - Array of flow names
 * @returns Promise resolving to the deployment ID
 */
export const uploadZipToApi = async (
  zipPath: string, 
  bundlePath: string,
  config: StepConfig, 
  deploymentConfig: DeploymentConfig,
  stepName: string,
  flowNames: string[]
): Promise<string> => {
  if (!deploymentConfig.apiKey) {
    throw new Error('API key is required for deployment. Please provide an API key.')
  }

  console.log(colors.blue('ℹ [INFO] '), `Uploading ${config.type} step "${stepName}" to API: ${path.basename(zipPath)}`)
  
  const formData = new FormData()
  formData.append('file', fs.createReadStream(zipPath), {
    filename: path.basename(zipPath),
    contentType: 'application/zip'
  })
  
  // Add metadata fields
  formData.append('type', config.type)
  formData.append('entrypointPath', config.entrypointPath)
  formData.append('bundlePath', bundlePath)
  formData.append('stepName', stepName)
  formData.append('flows', JSON.stringify(flowNames))
  formData.append('config', JSON.stringify(config.config))
  formData.append('environment', deploymentConfig.environment)
  formData.append('version', deploymentConfig.version)
  
  // Add specific fields based on step type
  if (config.config.type === 'api') {
    formData.append('apiPath', config.config.path || '')
    formData.append('apiMethod', config.config.method || 'GET')
  } else if (config.config.type === 'event') {
    formData.append('subscribes', JSON.stringify(config.config.subscribes || []))
    formData.append('emits', JSON.stringify(config.config.emits || []))
  } else if (config.config.type === 'cron') {
    formData.append('cronExpression', config.config.cron || '')
  }
  
  try {
    const headers: Record<string, string> = {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${deploymentConfig.apiKey}`
    }
    
    const response = await axios.post(API_URL, formData, { headers })
    
    if (response.status >= 200 && response.status < 300) {
      return response.data.deploymentId || `${config.type}-deployment-${Date.now()}`
    } else {
      throw new Error(`API responded with status ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API request failed: ${error.message}. Response: ${JSON.stringify(error.response?.data || {})}`)
    }
    throw error
  }
}

/**
 * Upload a step zip file to the deployment target
 * 
 * @param zipFile - Zip file information
 * @param deploymentConfig - Deployment configuration
 * @returns Promise resolving to the deployment ID
 */
export const uploadStepZip = async (
  zipFile: ZipFileInfo,
  deploymentConfig: DeploymentConfig
): Promise<string> => {
  return uploadZipToApi(
    zipFile.zipPath, 
    zipFile.bundlePath, 
    zipFile.config, 
    deploymentConfig, 
    zipFile.stepName, 
    zipFile.flowNames
  )
} 