import { Logger } from '../logger'
import { Step } from '../types'
import { StateOperation, StreamOperation, TraceError } from './types'

export interface TracerFactory {
  createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> | Tracer
  clear(): Promise<void>
}

export interface Tracer {
  end(err?: TraceError): void
  stateOperation(operation: StateOperation, input: unknown): void
  emitOperation(topic: string, data: unknown, success: boolean): void
  streamOperation(streamName: string, operation: StreamOperation, input: unknown): void
  child(step: Step, logger: Logger): Tracer
}
