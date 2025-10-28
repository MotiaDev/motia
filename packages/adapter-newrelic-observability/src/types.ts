export interface NewRelicObservabilityAdapterConfig {
  licenseKey: string
  appName?: string
  logLevel?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  enableLogs?: boolean
  enableTraces?: boolean
  enableMetrics?: boolean
  distributedTracingEnabled?: boolean
  transactionTracerEnabled?: boolean
  errorCollectorEnabled?: boolean
  customInsightsEvents?: boolean
}
