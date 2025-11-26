import { Stream } from '@motiadev/stream-client-node'
import type { Builder } from '../build/builder'
import type { CliContext, Message } from '../config-utils'
import { cloudApiWsUrl } from './cloud-api/endpoints'
import { cloudApi } from './cloud-api/index'
import type { DeployData, DeployListener } from './listeners/listener.types'

export type DeployInput = {
  envVars: Record<string, string>
  deploymentId: string
  deploymentToken: string
  builder: Builder
  listener: DeployListener
  context: CliContext
  ci: boolean
}

export const deploy = async (input: DeployInput): Promise<void> => {
  const { envVars, deploymentToken, builder, deploymentId, listener, context, ci } = input
  const client = new Stream(cloudApiWsUrl)

  const response = await cloudApi.startDeployment({
    deploymentToken,
    envVars,
    steps: builder.stepsConfig,
    streams: builder.streamsConfig,
    routers: builder.routersConfig,
  })

  context.log('starting-deployment', (message: Message) => message.tag('success').append('Deployment started'))

  if (!ci) {
    const subscription = client.subscribeItem<DeployData>('deployment', deploymentId, 'data')

    const interval = setInterval(() => {
      const state = subscription.getState()
      if (state) {
        listener.onDeployProgress(state)
      }
    }, 1000)

    await new Promise<void>((resolve) => {
      subscription.addChangeListener((item: DeployData) => {
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
  } else {
    context.log('deploy-progress', (message: Message) =>
      message
        .tag('progress')
        .append(`Deployment in progress... You can view the deployment at ${response?.deploymentUrl}`),
    )
    client.close()
  }
}
