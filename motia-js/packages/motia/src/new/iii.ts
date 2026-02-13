import type { InitOptions, ISdk } from 'iii-sdk'
import { init } from 'iii-sdk'

type OtelConfig = NonNullable<InitOptions['otel']>

const engineWsUrl = process.env.III_URL ?? 'ws://localhost:49134'

const createIII = (otelConfig?: Partial<OtelConfig>) => {
  return init(engineWsUrl, {
    otel: {
      enabled: true,
      serviceName: 'motia',
      ...otelConfig,
    },
  })
}

let instance: ISdk | undefined

export const getInstance = (): ISdk => {
  if (!instance) {
    instance = createIII()
  }
  return instance
}

export const initIII = (otelConfig?: Partial<OtelConfig>) => {
  instance = createIII(otelConfig)
  return instance
}
