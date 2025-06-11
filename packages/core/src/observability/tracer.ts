import { LockedData } from '../locked-data'
import { Step } from '../types'
import { MotiaStream } from '../types-stream'
import { StateOperation, StreamOperation, Trace, TraceGroup } from './types'

const createTrace = (traceGroup: TraceGroup, step: Step, traceStream: MotiaStream<Trace>) => {
  const id = crypto.randomUUID()
  const trace: Trace = {
    id,
    correlationId: traceGroup.correlationId,
    parentTraceId: traceGroup.id,
    status: 'running',
    startTime: Date.now(),
    endTime: undefined,
    entryPoint: { type: step.config.type, stepName: step.config.name },
    events: [],
    metadata: {
      totalSpans: 1,
      completedSpans: 0,
      errorCount: 0,
    },
  }

  traceStream.set(traceGroup.id, id, trace)

  return trace
}

export interface TracerFactory {
  createTracer(traceId: string, step: Step): Tracer
}

class BaseTracerFactory implements TracerFactory {
  constructor(
    private readonly traceStream: MotiaStream<Trace>,
    private readonly traceGroupStream: MotiaStream<TraceGroup>,
  ) {}

  createTracer(traceId: string, step: Step) {
    const traceGroup: TraceGroup = {
      id: traceId,
      name: step.config.name,
      lastActivity: Date.now(),
      totalDuration: 0,
      metadata: {
        totalTraces: 1,
        completedTraces: 0,
        activeTraces: 1,
        totalSteps: 1,
        averageStepDuration: 0,
      },
      correlationId: undefined,
      status: 'active',
      startTime: Date.now(),
    }

    this.traceGroupStream.set('default', traceId, traceGroup)

    const trace = createTrace(traceGroup, step, this.traceStream)

    return new StreamTracer(this.traceStream, this.traceGroupStream, traceGroup, trace)
  }
}

export interface Tracer {
  end(err?: Error | { message: string; code?: string | number }): void
  stateOperation(operation: StateOperation, input: unknown): void
  emitOperation(topic: string, data: unknown, success: boolean): void
  streamOperation(streamName: string, operation: StreamOperation, input: unknown): void
  child(step: Step): Tracer
}

export class StreamTracer implements Tracer {
  constructor(
    private readonly traceStream: MotiaStream<Trace>,
    private readonly traceGroupStream: MotiaStream<TraceGroup>,
    private readonly traceGroup: TraceGroup,
    private readonly trace: Trace,
  ) {}

  end(err?: Error | { message: string; code?: string | number }) {
    const endTime = Date.now()

    this.trace.status = err ? 'failed' : 'completed'
    this.trace.endTime = endTime

    this.traceStream.set(this.traceGroup.id, this.trace.id, this.trace)
  }

  stateOperation(operation: StateOperation, input: unknown) {
    this.trace.events.push({
      type: 'state',
      timestamp: Date.now(),
      operation,
      data: input,
    })
  }

  emitOperation(topic: string, data: unknown, success: boolean) {
    this.trace.events.push({
      type: 'emit',
      timestamp: Date.now(),
      topic,
      success,
      data,
    })
  }

  streamOperation(streamName: string, operation: StreamOperation, input: unknown) {
    this.trace.events.push({
      type: 'stream',
      timestamp: Date.now(),
      operation,
      data: input,
      streamName,
    })
  }

  child(step: Step) {
    const trace = createTrace(this.traceGroup, step, this.traceStream)

    return new StreamTracer(this.traceStream, this.traceGroupStream, this.traceGroup, trace)
  }
}

export const createTracerFactory = (lockedData: LockedData): TracerFactory => {
  const traceStream = lockedData.createStream<Trace>({
    filePath: '__motia.trace',
    hidden: true,
    config: {
      name: 'motia-trace',
      baseConfig: { storageType: 'default' },
      schema: null as never,
    },
  })()

  const traceGroupStream = lockedData.createStream<TraceGroup>({
    filePath: '__motia.trace-group',
    hidden: true,
    config: {
      name: 'motia-trace-group',
      baseConfig: { storageType: 'default' },
      schema: null as never,
    },
  })()

  return new BaseTracerFactory(traceStream, traceGroupStream)
}

export class NoTracer implements Tracer {
  end() {}
  stateOperation() {}
  emitOperation() {}
  streamOperation() {}
  child() {
    return this
  }
}
