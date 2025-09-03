import axios from 'axios'
import { cloudEndpoints } from './endpoints'

type CreateDeploymentRequest = {
  apiKey: string
  environmentId?: string
  versionName: string
  projectName?: string
}

type CreateDeploymentResult = {
  deploymentId: string
  deploymentToken: string
  environmentName: string
  projectName: string
  versionName: string
}

export const createDeployment = async (request: CreateDeploymentRequest): Promise<CreateDeploymentResult> => {
  const { apiKey, ...body } = request
  const { data } = await axios.post<CreateDeploymentResult>(cloudEndpoints.createDeployment, body, {
    headers: {
      'x-api-key': apiKey,
    },
  })

  return data
}
