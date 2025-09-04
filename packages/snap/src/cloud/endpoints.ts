import type { LockedData, MotiaServer } from '@motiadev/core'
import { randomUUID } from 'crypto'
import { version } from '../version'
import { buildValidation } from './build/build-validation'
import { build } from './new-deployment/build'
import { cloudApi } from './new-deployment/cloud-api'
import { StreamingDeploymentListener } from './new-deployment/listeners/streaming-deployment-listener'
import { type DeploymentData, DeploymentStreamManager } from './new-deployment/streams/deployment-stream'
import { uploadArtifacts } from './new-deployment/upload-artifacts'

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

  app.get('/__motia', (_, res) => {
    res.status(200).json({ version: version })
  })

  /* biome-ignore lint/suspicious/noExplicitAny: migration */
  app.post('/__motia/cloud/deploy/start', async (req: any, res: any) => {
    try {
      const { deploymentToken, deploymentId, envs } = req.body
      const sessionId = deploymentId || randomUUID()

      if (!deploymentToken || !deploymentId) {
        return res.status(400).json({
          success: false,
          error: 'deploymentToken and deploymentId are required',
        })
      }

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

          const builder = await build(listener).catch(() => {
            throw new Error('Build failed, check the logs for more information')
          })

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
          /* biome-ignore lint/suspicious/noExplicitAny: migration */
        } catch (error: any) {
          console.error('Deployment failed:', error)

          // Update stream with error
          if (listener) {
            await listener.onDeployError(error.message)
          }
        }
      })
      /* biome-ignore lint/suspicious/noExplicitAny: migration */
    } catch (error: any) {
      console.error('Failed to start deployment:', error)

      res.status(500).json({ success: false, error: error.message })
    }
  })

  /* biome-ignore lint/suspicious/noExplicitAny: migration */
  app.get('/__motia/cloud/deploy/status/:deploymentId', async (req: any, res: any) => {
    try {
      const { deploymentId } = req.params
      const deployment = await deploymentManager.getDeployment(deploymentId)

      return deployment
        ? res.status(200).json({ success: true, deployment })
        : res.status(404).json({ success: false, error: 'Deployment not found' })

      /* biome-ignore lint/suspicious/noExplicitAny: migration */
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message })
    }
  })
}
