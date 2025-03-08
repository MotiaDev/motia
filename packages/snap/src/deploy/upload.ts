import fs from 'fs'
import path from 'path'
import colors from 'colors'
import axios from 'axios'
import FormData from 'form-data'
import { DeploymentConfig } from './types'

export const API_URL = 'https://api.motiadev.com/deploy'

/**
 * Upload a single zip file to the API
 * 
 * @param zipPath - Path to the zip file
 * @param relativePath - Relative path of the zip file
 * @param apiKey - API key for authentication
 * @param environment - The deployment environment
 * @param version - The deployment version
 * @returns Promise resolving to the upload ID
 */
export const uploadZipFile = async (
  zipPath: string,
  relativePath: string,
  apiKey: string,
  environment: string = 'dev',
  version: string = 'latest'
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is required for deployment. Please provide an API key.')
  }

  console.log(colors.blue('ℹ [INFO] '), `Uploading zip file: ${path.basename(zipPath)}`)
  
  const formData = new FormData()
  formData.append('file', fs.createReadStream(zipPath), {
    filename: path.basename(zipPath),
    contentType: 'application/zip'
  })
  
  formData.append('path', relativePath)
  formData.append('environment', environment)
  formData.append('version', version)
  
  try {
    const headers: Record<string, string> = {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${apiKey}`
    }
    
    const response = await axios.post(`${API_URL}/files`, formData, { headers })
    
    if (response.status >= 200 && response.status < 300) {
      return response.data.uploadId || `upload-${Date.now()}`
    } else {
      throw new Error(`API responded with status ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`File upload failed: ${error.message}. Response: ${JSON.stringify(error.response?.data || {})}`)
    }
    throw error
  }
}

/**
 * Upload the steps configuration to the API
 * 
 * @param stepsConfig - The steps configuration
 * @param apiKey - API key for authentication
 * @param environment - The deployment environment
 * @param version - The deployment version
 * @returns Promise resolving to the config upload ID
 */
export const uploadStepsConfig = async (
  stepsConfig: Record<string, any>,
  apiKey: string,
  environment: string = 'dev',
  version: string = 'latest'
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is required for deployment. Please provide an API key.')
  }

  console.log(colors.blue('ℹ [INFO] '), 'Uploading steps configuration')
  
  try {
    const response = await axios.post(
      `${API_URL}/config`, 
      { 
        config: stepsConfig,
        environment,
        version
      },
      { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )
    
    if (response.status >= 200 && response.status < 300) {
      return response.data.configId || `config-${Date.now()}`
    } else {
      throw new Error(`API responded with status ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Config upload failed: ${error.message}. Response: ${JSON.stringify(error.response?.data || {})}`)
    }
    throw error
  }
}

/**
 * Start the deployment process
 * 
 * @param uploadIds - Array of file upload IDs
 * @param configId - Configuration upload ID
 * @param deploymentConfig - Deployment configuration
 * @returns Promise resolving to the deployment ID
 */
export const startDeployment = async (
  uploadIds: string[],
  configId: string,
  deploymentConfig: DeploymentConfig
): Promise<string> => {
  if (!deploymentConfig.apiKey) {
    throw new Error('API key is required for deployment. Please provide an API key.')
  }

  console.log(colors.blue('ℹ [INFO] '), 'Starting deployment process')
  
  try {
    const response = await axios.post(
      `${API_URL}/start`, 
      {
        uploadIds,
        configId,
        environment: deploymentConfig.environment,
        version: deploymentConfig.version
      },
      { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deploymentConfig.apiKey}`,
          'X-Environment': deploymentConfig.environment,
          'X-Version': deploymentConfig.version
        }
      }
    )
    
    if (response.status >= 200 && response.status < 300) {
      return response.data.deploymentId || `deployment-${Date.now()}`
    } else {
      throw new Error(`API responded with status ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Deployment start failed: ${error.message}. Response: ${JSON.stringify(error.response?.data || {})}`)
    }
    throw error
  }
} 