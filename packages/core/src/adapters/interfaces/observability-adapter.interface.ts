import type { Logger } from '../../logger'
import type { StateOperation, StreamOperation, TraceError } from '../../observability/types'
import type { Step } from '../../types'

export interface Metric {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: number
}

export interface Tracer {
  end(err?: TraceError): Promise<void>
  stateOperation(operation: StateOperation, input: unknown): Promise<void>
  emitOperation(topic: string, data: unknown, success: boolean): Promise<void>
  streamOperation(streamName: string, operation: StreamOperation, input: unknown): Promise<void>
  child(step: Step, logger: Logger): Tracer
}

export interface ObservabilityAdapter {
  createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> | Tracer
  attachToTrace(traceId: string, step: Step, logger: Logger): Promise<Tracer> | Tracer
  clear(): Promise<void>
  recordMetric?(metric: Metric): Promise<void> | void
}
