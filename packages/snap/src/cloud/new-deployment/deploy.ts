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
  ci: boolean
}

export const deploy = async (input: DeployInput): Promise<void> => {
  const { envVars, deploymentToken, builder, deploymentId, listener, context, ci } = input
  const client = new Stream(cloudApiWsUrl)

  await cloudApi.startDeployment({
    deploymentToken,
    envVars,
    steps: builder.stepsConfig,
    streams: builder.streamsConfig,
    routers: builder.routersConfig,
  })

  context.log('starting-deployment', (message) => message.tag('success').append('Deployment started'))

  if (!ci) {
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
  } else {
    context.log('deploy-progress', (message) =>
      message.tag('progress').append('Deployment in progress... You will be notified when it is completed'),
    )
  }
}
