import axios from 'axios'
import type { BuildRoutersConfig, BuildStepsConfig, BuildStreamsConfig } from '../../build/builder'
import { cloudEndpoints } from './endpoints'

type StartDeploymentRequest = {
  envVars: Record<string, string>
  deploymentToken: string
  steps: BuildStepsConfig
  streams: BuildStreamsConfig
  routers: BuildRoutersConfig
}

export const startDeployment = async (request: StartDeploymentRequest): Promise<void> => {
  await axios.post(cloudEndpoints.startDeployment, request)
}
