import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'
import { DeploymentConfig, ZipFileInfo } from './types'
import { logger } from './logger'
import { errorHandler } from './error-handler'

export const API_URL = 'https://api.motiadev.com/deploy'

export class DeploymentService {
  static async uploadZipFile(
    zipPath: string,
    relativePath: string,
    apiKey: string,
    environment: string = 'dev',
    version: string = 'latest'
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key is required for deployment. Please provide an API key.')
    }

    if (!fs.existsSync(zipPath)) {
      throw new Error(`Zip file not found: ${zipPath}. Please check if the file exists.`)
    }

    logger.uploadingFile(path.basename(zipPath))
    
    const formData = new FormData()
    
    try {
      formData.append('file', fs.createReadStream(zipPath), {
        filename: path.basename(zipPath),
        contentType: 'application/zip'
      })
    } catch (error) {
      throw new Error(`Failed to read zip file ${zipPath}: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    formData.append('path', relativePath)
    formData.append('environment', environment)
    formData.append('version', version)
    
    try {
      const headers: Record<string, string> = {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${apiKey}`
      }
      
      const response = await axios.post(`${API_URL}/files`, formData, { 
        headers,
        timeout: 30000, // 30 seconds timeout
        maxContentLength: 50 * 1024 * 1024, // 50MB max file size
        maxBodyLength: 50 * 1024 * 1024 // 50MB max body size
      })
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.uploadId || `upload-${Date.now()}`
      } else {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}. Response: ${JSON.stringify(response.data || {})}`)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw errorHandler.handleAxiosError(error, 'zip file')
      }
      throw error
    }
  }

  static async uploadStepsConfig(
    stepsConfig: Record<string, any>,
    apiKey: string,
    environment: string = 'dev',
    version: string = 'latest'
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key is required for deployment. Please provide an API key.')
    }

    if (!stepsConfig || Object.keys(stepsConfig).length === 0) {
      throw new Error('Steps configuration is empty. Please check your motia.steps.json file.')
    }

    logger.uploadingConfig()
    
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
          },
          timeout: 30000 // 30 seconds timeout
        }
      )
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.configId || `config-${Date.now()}`
      } else {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}. Response: ${JSON.stringify(response.data || {})}`)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw errorHandler.handleAxiosError(error, 'configuration')
      }
      throw error
    }
  }

  static async startDeployment(
    uploadIds: string[],
    configId: string,
    deploymentConfig: DeploymentConfig
  ): Promise<string> {
    if (!deploymentConfig.apiKey) {
      throw new Error('API key is required for deployment. Please provide an API key.')
    }

    if (!uploadIds || uploadIds.length === 0) {
      throw new Error('No upload IDs provided. Please ensure all files were uploaded successfully.')
    }

    if (!configId) {
      throw new Error('No configuration ID provided. Please ensure the configuration was uploaded successfully.')
    }

    logger.startingDeployment()
    
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
          },
          timeout: 30000 // 30 seconds timeout
        }
      )
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.deploymentId || `deployment-${Date.now()}`
      } else {
        throw new Error(`API responded with status ${response.status}: ${response.statusText}. Response: ${JSON.stringify(response.data || {})}`)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw errorHandler.handleAxiosError(error, 'deployment')
      }
      throw error
    }
  }

  static async uploadStepZip(
    zipFile: ZipFileInfo,
    deploymentConfig: DeploymentConfig
  ): Promise<string> {
    return this.uploadZipFile(
      zipFile.zipPath, 
      zipFile.bundlePath, 
      deploymentConfig.apiKey as string, 
      deploymentConfig.environment, 
      deploymentConfig.version
    )
  }
} 