import { MotiaStream } from '@motiadev/core'

export type BuildOutput = {
  packagePath: string
  language: string
  status: 'building' | 'built' | 'error'
  size?: number
  type: 'event' | 'api' | 'cron'
  errorMessage?: string
}

export type UploadOutput = {
  packagePath: string
  language: string
  status: 'uploading' | 'uploaded' | 'error'
  size?: number
  progress?: number
  type: 'event' | 'api' | 'cron'
  errorMessage?: string
}

export type Metadata = {
  totalSteps?: number
  builtSteps?: number
  uploadedSteps?: number
}

export interface DeploymentData {
  id: string
  status: 'idle' | 'building' | 'uploading' | 'deploying' | 'completed' | 'failed'
  phase: 'build' | 'upload' | 'deploy' | null
  message: string
  build: BuildOutput[]
  upload: UploadOutput[]
  error?: string
  startedAt?: number
  completedAt?: number
  metadata?: Metadata
}

export const createDefaultDeploymentData = (deploymentId: string): DeploymentData => ({
  id: deploymentId,
  status: 'idle',
  phase: null,
  message: 'No deployment in progress',
  build: [],
  upload: [],
  metadata: {
    totalSteps: 0,
    builtSteps: 0,
    uploadedSteps: 0,
  },
})

export class DeploymentStreamManager {
  constructor(private stream: MotiaStream<DeploymentData>) {}

  async getDeployment(deploymentId: string): Promise<DeploymentData | null> {
    return await this.stream.get(deploymentId, 'data')
  }

  async updateDeployment(deploymentId: string, data: Partial<DeploymentData>): Promise<void> {
    const current = await this.getDeployment(deploymentId)
    if (!current) {
      await this.stream.set(deploymentId, 'data', {
        ...createDefaultDeploymentData(deploymentId),
        ...data,
        id: deploymentId,
      })
    } else {
      const updated = {
        ...current,
        ...data,
        id: deploymentId,
        deploymentId,
      }
      await this.stream.set(deploymentId, 'data', updated)
    }
  }

  async startDeployment(deploymentId: string): Promise<void> {
    const defaultData = createDefaultDeploymentData(deploymentId)
    await this.stream.set(deploymentId, 'data', {
      ...defaultData,
      status: 'building',
      phase: 'build',
      startedAt: Date.now(),
      id: deploymentId,
      message: 'Starting deployment...',
    })
  }

  async completeDeployment(deploymentId: string, error?: string): Promise<void> {
    const current = await this.getDeployment(deploymentId)
    if (!current) return

    await this.stream.set(deploymentId, 'data', {
      ...current,
      status: error ? 'failed' : 'completed',
      phase: error ? current.phase : null,
      message: error || 'Deployment completed successfully',
      completedAt: Date.now(),
      error,
    })
  }

  async updateBuildOutput(deploymentId: string, buildOutput: BuildOutput): Promise<void> {
    const current = await this.getDeployment(deploymentId)
    if (!current) return

    const existingIndex = current.build.findIndex((b) => b.packagePath === buildOutput.packagePath)
    const updatedBuild = [...current.build]

    if (existingIndex >= 0) {
      updatedBuild[existingIndex] = buildOutput
    } else {
      updatedBuild.push(buildOutput)
    }

    const builtSteps = updatedBuild.filter((b) => b.status === 'built').length
    const metadata = {
      ...current.metadata,
      builtSteps,
    }

    await this.updateDeployment(deploymentId, { build: updatedBuild, metadata })
  }

  async updateUploadOutput(deploymentId: string, uploadOutput: UploadOutput): Promise<void> {
    const current = await this.getDeployment(deploymentId)
    if (!current) return

    const existingIndex = current.upload.findIndex((u) => u.packagePath === uploadOutput.packagePath)
    const updatedUpload = [...current.upload]

    if (existingIndex >= 0) {
      updatedUpload[existingIndex] = uploadOutput
    } else {
      updatedUpload.push(uploadOutput)
    }

    // Update uploadedSteps count
    const uploadedSteps = updatedUpload.filter((u) => u.status === 'uploaded').length
    const metadata: Metadata = {
      ...current.metadata,
      uploadedSteps,
    }

    await this.updateDeployment(deploymentId, { upload: updatedUpload, metadata })
  }
}
