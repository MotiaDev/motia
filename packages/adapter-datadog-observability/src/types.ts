export interface DatadogObservabilityAdapterConfig {
  apiKey: string
  service?: string
  env?: string
  version?: string
  hostname?: string
  agentHost?: string
  agentPort?: number
  enableLogs?: boolean
  enableTraces?: boolean
  enableMetrics?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  sampleRate?: number
  flushInterval?: number
}
