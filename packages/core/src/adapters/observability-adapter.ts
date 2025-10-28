import type { Logger } from '../logger'
import type { LogEntry, StateOperation, StreamOperation, Trace, TraceError } from '../observability/types'
import type { Step } from '../types'

export interface Tracer {
  end(err?: TraceError): void
  stateOperation(operation: StateOperation, input: unknown): void
  emitOperation(topic: string, data: unknown, success: boolean): void
  streamOperation(streamName: string, operation: StreamOperation, input: unknown): void
  child(step: Step, logger: Logger): Tracer
}

export interface Metric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  type?: 'counter' | 'gauge' | 'histogram' | 'distribution'
}

export interface ObservabilityAdapter {
  createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> | Tracer
  attachToTrace(traceId: string, step: Step, logger: Logger): Promise<Tracer> | Tracer

  clear(): Promise<void>
  shutdown(): Promise<void>

  exportTrace?(trace: Trace): Promise<void>
  exportLog?(log: LogEntry): Promise<void>
  exportMetric?(metric: Metric): Promise<void>
}
