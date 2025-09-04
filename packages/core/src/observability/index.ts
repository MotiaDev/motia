import type { Logger } from '../logger'
import type { Step } from '../types'
import type { StateOperation, StreamOperation, TraceError } from './types'

export interface TracerFactory {
  createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> | Tracer
}

export interface Tracer {
  end(err?: TraceError): void
  stateOperation(operation: StateOperation, input: unknown): void
  emitOperation(topic: string, data: unknown, success: boolean): void
  streamOperation(streamName: string, operation: StreamOperation, input: unknown): void
  child(step: Step, logger: Logger): Tracer
}
