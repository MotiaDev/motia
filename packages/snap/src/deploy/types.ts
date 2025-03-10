/**
 * Type definitions for the deployment system
 */

/**
 * Configuration for a step
 */
export interface StepConfig {
  type: 'node' | 'python'
  entrypointPath: string
  config: Record<string, any>
}

/**
 * Configuration for all steps
 */
export interface StepsConfig {
  [bundlePath: string]: StepConfig
}

/**
 * Configuration for deployment
 */
export interface DeploymentConfig {
  apiKey?: string
  environment: string
  version: string
}

/**
 * Result of a deployment operation
 */
export interface DeploymentResult {
  bundlePath: string
  deploymentId?: string
  stepType: 'node' | 'python'
  stepName?: string
  stepPath?: string
  flowName?: string
  stepConfig?: Record<string, any>
  environment: string
  version: string
  error?: string
  success: boolean
}

/**
 * Information about a zip file to be deployed
 */
export interface ZipFileInfo {
  zipPath: string
  bundlePath: string
  config: StepConfig
  stepName: string
  flowNames: string[]
}

/**
 * Summary of a deployment operation
 */
export interface DeploymentSummary {
  totalSteps: number
  successfulDeployments: number
  failedDeployments: number
  deploymentTime: string
  environment: string
  version: string
  flows: {
    name: string
    steps: {
      name?: string
      type: 'node' | 'python'
      path?: string
      success: boolean
      deploymentId?: string
      error?: string
    }[]
  }[]
} 