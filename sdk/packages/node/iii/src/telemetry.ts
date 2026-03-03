export type { ConnectionStateCallback } from './iii'

export type {
  FunctionInfo,
  FunctionInfo as FunctionMessage,
  WorkerInfo,
  WorkerStatus,
} from './iii-types'

export type { WorkerMetrics } from './worker-metrics'

export {
  type IIIConnectionState,
  type IIIReconnectionConfig,
  DEFAULT_BRIDGE_RECONNECTION_CONFIG,
  DEFAULT_INVOCATION_TIMEOUT_MS,
  EngineFunctions,
  EngineTriggers,
  LogFunctions,
} from './iii-constants'
export { WorkerMetricsCollector } from './worker-metrics'

export {
  registerWorkerGauges,
  stopWorkerGauges,
  type WorkerGaugesOptions,
} from './otel-worker-gauges'

export {
  currentSpanId,
  currentTraceId,
  extractBaggage,
  extractContext,
  extractTraceparent,
  getAllBaggage,
  getBaggageEntry,
  getLogger,
  getMeter,
  getTracer,
  initOtel,
  injectBaggage,
  injectTraceparent,
  removeBaggageEntry,
  setBaggageEntry,
  shutdownOtel,
  withSpan,
  type OtelConfig,
  type Span,
  type Logger as OtelLogger,
  type Meter,
  SeverityNumber,
  SpanStatusCode,
} from './telemetry-system'

export type {
  FunctionsAvailableCallback,
  LogCallback,
  LogConfig,
  LogSeverityLevel,
  OtelLogEvent,
} from './types'

export { safeStringify } from './utils'
