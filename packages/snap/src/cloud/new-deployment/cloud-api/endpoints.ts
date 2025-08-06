export const cloudApiBaseUrl = process.env.MOTIACLOUD_API_BASE_URL || 'https://motia-hub-api.motiahub.com'
export const cloudApiWsUrl = process.env.MOTIACLOUD_API_WS_URL || 'wss://motia-hub-api.motiahub.com'

export const cloudEndpoints = {
  createDeployment: `${cloudApiBaseUrl}/v1/deployments`,
  startDeployment: `${cloudApiBaseUrl}/v1/deployments/start`,
  upload: `${cloudApiBaseUrl}/v1/deployments/upload`,
}
