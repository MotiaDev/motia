import axios from 'axios'
import { BuildRoutersConfig, BuildStepsConfig, BuildStreamsConfig } from '../../build/builder'
import { cloudEndpoints } from './endpoints'

type StartDeploymentRequest = {
  envVars: Record<string, string>
  deploymentToken: string
  steps: BuildStepsConfig
  streams: BuildStreamsConfig
  routers: BuildRoutersConfig
}

type StartDeploymentResult = {
  deploymentUrl: string
}

export const startDeployment = async (request: StartDeploymentRequest): Promise<StartDeploymentResult> => {
  const response = await axios.post<StartDeploymentResult>(cloudEndpoints.startDeployment, request)
  return response.data
}
