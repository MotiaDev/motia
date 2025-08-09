import axios from 'axios'
import { cloudEndpoints } from './endpoints'

type CreateDeploymentRequest = {
  apiKey: string
  environmentId?: string
  versionName: string
}

type CreateDeploymentResult = {
  deploymentId: string
  deploymentToken: string
  environmentName: string
  projectName: string
  versionName: string
}

export const createDeployment = async (request: CreateDeploymentRequest): Promise<CreateDeploymentResult> => {
  const { data } = await axios.post<CreateDeploymentResult>(cloudEndpoints.createDeployment, request)

  return data
}
