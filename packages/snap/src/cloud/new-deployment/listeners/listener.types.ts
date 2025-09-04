import type { Step } from '@motiadev/core'
import type { Stream } from '@motiadev/core/dist/src/types-stream'
import type { BuildStepConfig } from '../../build/builder'
import type { ValidationError } from '../utils/validation'

export type BuildListener = {
  onBuildStart: (step: Step) => void
  onBuildProgress: (step: Step, message: string) => void
  onBuildEnd: (step: Step, size: number) => void
  onBuildError: (step: Step, error: Error) => void
  onBuildSkip: (step: Step, reason: string) => void

  onApiRouterBuilding: (language: string) => void
  onApiRouterBuilt: (language: string, size: number) => void

  onStreamCreated: (stream: Stream) => void

  onWarning: (id: string, message: string) => void

  onBuildWarning: (warning: ValidationError) => void
  onBuildErrors: (errors: ValidationError[]) => void
}

export type UploadListener = {
  stepUploadStart: (stepPath: string, step: BuildStepConfig) => void
  stepUploadProgress: (stepPath: string, step: BuildStepConfig, progress: number) => void
  stepUploadEnd: (stepPath: string, step: BuildStepConfig) => void
  stepUploadError: (stepPath: string, step: BuildStepConfig) => void

  routeUploadStart: (path: string, language: string) => void
  routeUploadProgress: (path: string, language: string, progress: number) => void
  routeUploadEnd: (path: string, language: string) => void
  routeUploadError: (path: string, language: string) => void
}

export type DeploymentOutput = {
  output: Record<string, string>
}

export type DeployStatus = 'pending' | 'progress' | 'completed' | 'failed'
export type DeployData = {
  id: string
  status: DeployStatus
  endpoints: Array<{
    method: string
    path: string
    stepName: string
    emits: string[]
    status: DeployStatus
  }>
  events: Array<{
    topics: string[]
    queue: string
    stepName: string
    status: DeployStatus
  }>
  cron: Array<{
    cron: string
    stepName: string
    emits: string[]
    status: DeployStatus
  }>
  outputs: Record<string, string>
}

export type DeployListener = {
  onDeployStart: () => void
  onDeployProgress: (data: DeployData) => void
  onDeployEnd: (output: DeploymentOutput) => void
  onDeployError: (errorMessage: string) => void
}

export type DeploymentListener = BuildListener & UploadListener & DeployListener
