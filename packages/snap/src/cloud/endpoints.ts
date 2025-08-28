import { randomUUID } from 'crypto'
import { LockedData, MotiaServer } from '@motiadev/core'
import { buildValidation } from './build/build-validation'
import { StreamingDeploymentListener } from './new-deployment/listeners/streaming-deployment-listener'
import { build } from './new-deployment/build'
import { uploadArtifacts } from './new-deployment/upload-artifacts'
import { DeploymentData, DeploymentStreamManager } from './new-deployment/streams/deployment-stream'
import { cloudApi } from './new-deployment/cloud-api'
import colors from 'colors'

export const deployEndpoints = (server: MotiaServer, lockedData: LockedData) => {
  const { app } = server

  // Criar stream de deployment se não existir
  const deploymentStream = lockedData.createStream<DeploymentData>({
    filePath: '__motia.deployment',
    hidden: true,
    config: {
      name: '__motia.deployment',
      baseConfig: { storageType: 'default' },
      schema: null as never,
    },
  })()

  const deploymentManager = new DeploymentStreamManager(deploymentStream)

  app.post('/cloud/deploy/start', async (req, res) => {
    try {
      const { deploymentToken, deploymentId, envs } = req.body

      if (!deploymentToken || !deploymentId) {
        return res.status(400).json({
          success: false,
          error: 'deploymentToken and deploymentId are required',
        })
      }

      colors.disable()

      const sessionId = deploymentId || randomUUID()

      await deploymentManager.startDeployment(sessionId)

      const listener = new StreamingDeploymentListener(sessionId, deploymentStream)

      res.json({
        success: true,
        message: 'Deployment started',
        deploymentId: sessionId,
        streamName: 'deployment-status',
        groupId: 'deployments',
        itemId: sessionId,
      })

      setImmediate(async () => {
        try {
          await listener.startBuildPhase()

          const builder = await build(listener)

          const isValid = buildValidation(builder, listener)

          if (!isValid) {
            await listener.onBuildErrors(listener.getErrors())
            return
          }

          await listener.startUploadPhase()

          await uploadArtifacts(builder, deploymentToken, listener)

          await listener.startDeployPhase()

          await cloudApi.startDeployment({
            deploymentToken,
            envVars: envs,
            steps: builder.stepsConfig,
            streams: builder.streamsConfig,
            routers: builder.routersConfig,
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error('Deployment failed:', error)

          // Update stream with error
          if (listener) {
            await listener.onDeployError(error.message)
          }
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Failed to start deployment:', error)
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })

  // Get deployment status by ID
  app.get('/cloud/deploy/status/:deploymentId', async (req, res) => {
    try {
      const { deploymentId } = req.params
      const deployment = await deploymentManager.getDeployment(deploymentId)

      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found',
        })
      }

      res.json({
        success: true,
        deployment,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  })
}
