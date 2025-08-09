import { Builder } from '../build/builder'
import { CliContext } from '../config-utils'
import { cloudApi } from './cloud-api'
import { cloudApiWsUrl } from './cloud-api/endpoints'
import { DeployData, DeployListener } from './listeners/listener.types'
import { Stream } from '@motiadev/stream-client-node'

export type DeployInput = {
  envVars: Record<string, string>
  deploymentId: string
  deploymentToken: string
  builder: Builder
  listener: DeployListener
  context: CliContext
}

export const deploy = async (input: DeployInput): Promise<void> => {
  const { envVars, deploymentToken, builder, deploymentId, listener, context } = input
  const client = new Stream(cloudApiWsUrl)

  await cloudApi.startDeployment({
    deploymentToken,
    envVars,
    steps: builder.stepsConfig,
    streams: builder.streamsConfig,
    routers: builder.routersConfig,
  })

  context.log('starting-deployment', (message) => message.tag('success').append('Deployment started'))

  const subscription = client.subscribeItem<DeployData>('deployment', deploymentId, 'data')

  await new Promise<void>((resolve) => {
    subscription.addChangeListener((item) => {
      if (item) {
        listener.onDeployProgress(item)

        if (item.status === 'completed') {
          // TODO [motia-deploy] add deployment output
          listener.onDeployEnd({
            output: {
              ApiGatewayUrl: 'https://api.snap.motia.dev',
              WebSocketUrl: 'wss://api.snap.motia.dev',
            },
          })
        }

        if (['failed', 'completed'].includes(item.status)) {
          client.close()
          resolve()
        }
      }
    })
  })
}
