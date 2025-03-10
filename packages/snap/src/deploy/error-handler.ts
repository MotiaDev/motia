import { AxiosError } from 'axios'
import { logger } from './logger'

export interface FailedUpload {
  path: string
  name: string
  type: string
  error: string
}

export class ErrorHandler {
  formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }

  handleAxiosError(error: AxiosError, operation: string): Error {
    if (error.code === 'ECONNREFUSED') {
      return new Error(`Connection refused: Unable to connect to the API server. Please check if the server is running.`)
    } else if (error.code === 'ENOTFOUND') {
      return new Error(`Host not found: Please check your network connection and the API URL.`)
    } else if (error.code === 'ETIMEDOUT') {
      return new Error(`Connection timed out: The server took too long to respond.`)
    } else if (error.response) {
      // The server responded with a status code outside the 2xx range
      const statusCode = error.response.status
      const responseData = JSON.stringify(error.response.data || {})
      
      if (statusCode === 401 || statusCode === 403) {
        return new Error(`Authentication error (${statusCode}): Invalid API key or insufficient permissions. Response: ${responseData}`)
      } else if (statusCode === 404) {
        return new Error(`Not found error (${statusCode}): The API endpoint was not found. Response: ${responseData}`)
      } else if (statusCode === 413) {
        return new Error(`Payload too large (${statusCode}): The ${operation} exceeds the maximum allowed size. Response: ${responseData}`)
      } else if (statusCode >= 500) {
        return new Error(`Server error (${statusCode}): The API server encountered an error. Response: ${responseData}`)
      } else {
        return new Error(`API request failed with status ${statusCode}: ${error.response.statusText}. Response: ${responseData}`)
      }
    } else if (error.request) {
      // The request was made but no response was received
      return new Error(`No response received from server. Please check your network connection.`)
    } else {
      return new Error(`Request setup error: ${error.message}. Please check your request configuration.`)
    }
  }

  handleUploadFailures(failedUploads: FailedUpload[], totalCount: number): void {
    logger.error('Some files failed to upload. Deployment aborted.')
    logger.error(`Failed uploads: ${failedUploads.length}/${totalCount}`)
    
    logger.error('Failed uploads details:')
    failedUploads.forEach((failure, index) => {
      logger.errorItem(index + 1, `${failure.name} (${failure.type}) - ${failure.path}`)
      logger.errorDetail(failure.error)
    })
  }

  handleConfigUploadFailure(error: string): void {
    logger.error(`Failed to upload steps configuration: ${error}`)
  }

  handleDeploymentStartFailure(error: string): void {
    logger.error(`Failed to start deployment: ${error}`)
  }

  handleGeneralDeploymentFailure(error: string): void {
    logger.error(`Deployment failed: ${error}`)
    
    if (error.includes('ECONNREFUSED') || error.includes('ENOTFOUND')) {
      logger.error('Connection error: Unable to connect to the API server')
    } else if (error.includes('401') || error.includes('403')) {
      logger.error('Authentication error: Invalid or insufficient permissions')
    } else if (error.includes('404')) {
      logger.error('Not found error: The requested resource was not found')
    } else if (error.includes('500')) {
      logger.error('Server error: The API server encountered an error')
    }
  }
}

export const errorHandler = new ErrorHandler() 