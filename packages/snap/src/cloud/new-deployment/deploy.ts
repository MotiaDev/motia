import { Stream } from '@motiadev/stream-client-node'
import type { Builder } from '../build/builder'
import type { CliContext } from '../config-utils'
import { cloudApi } from './cloud-api'
import { cloudApiWsUrl } from './cloud-api/endpoints'
import type { DeployData, DeployListener } from './listeners/listener.types'

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

  const interval = setInterval(() => {
    const state = subscription.getState()
    if (state) {
      listener.onDeployProgress(state)
    }
  }, 1000)

  await new Promise<void>((resolve) => {
    subscription.addChangeListener((item) => {
      if (item && ['failed', 'completed'].includes(item.status)) {
        clearInterval(interval)
        listener.onDeployProgress(item)

        if (item.status === 'completed') {
          listener.onDeployEnd({
            output: item.outputs,
          })
        }

        client.close()
        resolve()
      }
    })
  })
}
