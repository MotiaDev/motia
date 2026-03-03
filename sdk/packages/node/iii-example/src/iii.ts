import { init } from 'iii-sdk'
import { version } from '../package.json'

// Engine WebSocket URL - used for both III and telemetry
const engineWsUrl = process.env.III_BRIDGE_URL ?? 'ws://localhost:49134'

export const iii = init(engineWsUrl, {
  otel: {
    enabled: true,
    serviceName: 'iii-example',
    metricsEnabled: true,
    serviceVersion: version,
    reconnectionConfig: {
      maxRetries: 10,
    },
    metricsExportIntervalMs: 10000,
  },
})
