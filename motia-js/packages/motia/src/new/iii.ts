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

export let iii: ISdk | undefined

export const initIII = (otelConfig?: Partial<OtelConfig>) => {
  iii = createIII(otelConfig)
  return iii
}
