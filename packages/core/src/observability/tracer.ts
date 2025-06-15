import { LockedData } from '../locked-data'
import { Logger } from '../logger'
import { Step } from '../types'
import { MotiaStream } from '../types-stream'
import { StateOperation, StreamOperation, Trace, TraceEvent, TraceGroup } from './types'

class TraceManager {
  constructor(
    private readonly traceStream: MotiaStream<Trace>,
    private readonly traceGroupStream: MotiaStream<TraceGroup>,
    private readonly traceGroup: TraceGroup,
    private readonly trace: Trace,
  ) {
    this.updateTrace()
    this.updateTraceGroup()
  }

  updateTrace() {
    this.traceStream.set(this.traceGroup.id, this.trace.id, this.trace)
  }

  updateTraceGroup() {
    this.traceGroupStream.set('default', this.traceGroup.id, this.traceGroup)
  }

  child(trace: Trace) {
    return new TraceManager(this.traceStream, this.traceGroupStream, this.traceGroup, trace)
  }
}

const createTrace = (traceGroup: TraceGroup, step: Step) => {
  const id = crypto.randomUUID()
  const trace: Trace = {
    id,
    name: step.config.name,
    correlationId: traceGroup.correlationId,
    parentTraceId: traceGroup.id,
    status: 'running',
    startTime: Date.now(),
    endTime: undefined,
    entryPoint: { type: step.config.type, stepName: step.config.name },
    events: [],
  }

  traceGroup.metadata.totalSteps++
  traceGroup.metadata.activeSteps++

  return trace
}

export interface TracerFactory {
  createTracer(traceId: string, step: Step, logger: Logger): Tracer
}

class BaseTracerFactory implements TracerFactory {
  constructor(
    private readonly traceStream: MotiaStream<Trace>,
    private readonly traceGroupStream: MotiaStream<TraceGroup>,
  ) {}

  createTracer(traceId: string, step: Step, logger: Logger) {
    const traceGroup: TraceGroup = {
      id: traceId,
      name: step.config.name,
      lastActivity: Date.now(),
      metadata: {
        completedSteps: 0,
        activeSteps: 0,
        totalSteps: 0,
      },
      correlationId: undefined,
      status: 'running',
      startTime: Date.now(),
    }

    const trace = createTrace(traceGroup, step)
    const manager = new TraceManager(this.traceStream, this.traceGroupStream, traceGroup, trace)

    return new StreamTracer(manager, traceGroup, trace, logger)
  }
}

export interface Tracer {
  end(err?: Error | { message: string; code?: string | number }): void
  stateOperation(operation: StateOperation, input: unknown): void
  emitOperation(topic: string, data: unknown, success: boolean): void
  streamOperation(streamName: string, operation: StreamOperation, input: unknown): void
  child(step: Step, logger: Logger): Tracer
}

export class StreamTracer implements Tracer {
  constructor(
    private readonly manager: TraceManager,
    private readonly traceGroup: TraceGroup,
    private readonly trace: Trace,
    logger: Logger,
  ) {
    logger.addListener((level, msg, args) => {
      this.addEvent({
        type: 'log',
        timestamp: Date.now(),
        level,
        message: msg,
        metadata: args,
      })
    })
  }

  end(err?: Error | { message: string; code?: string | number }) {
    this.trace.status = err ? 'failed' : 'completed'
    this.trace.endTime = Date.now()

    this.traceGroup.metadata.completedSteps++
    this.traceGroup.metadata.activeSteps--

    if (this.traceGroup.metadata.activeSteps === 0) {
      this.traceGroup.status = 'completed'
      this.traceGroup.endTime = Date.now()
    }

    this.manager.updateTrace()
    this.manager.updateTraceGroup()
  }

  stateOperation(operation: StateOperation, input: unknown) {
    this.addEvent({
      type: 'state',
      timestamp: Date.now(),
      operation,
      data: input,
    })
  }

  emitOperation(topic: string, data: unknown, success: boolean) {
    this.addEvent({
      type: 'emit',
      timestamp: Date.now(),
      topic,
      success,
      data,
    })
  }

  streamOperation(
    streamName: string,
    operation: StreamOperation,
    input: { groupId: string; id: string; data?: unknown },
  ) {
    if (operation === 'set') {
      const lastEvent = this.trace.events[this.trace.events.length - 1]

      if (
        lastEvent &&
        lastEvent.type === 'stream' &&
        lastEvent.streamName === streamName &&
        lastEvent.data.groupId === input.groupId &&
        lastEvent.data.id === input.id
      ) {
        lastEvent.calls++
        lastEvent.data.data = input.data
        lastEvent.maxTimestamp = Date.now()

        this.traceGroup.lastActivity = lastEvent.maxTimestamp
        this.manager.updateTrace()
        this.manager.updateTraceGroup()

        return
      }
    }

    this.addEvent({
      type: 'stream',
      timestamp: Date.now(),
      operation,
      data: input,
      streamName,
      calls: 1,
    })
  }

  child(step: Step, logger: Logger) {
    const trace = createTrace(this.traceGroup, step)
    const manager = this.manager.child(trace)

    return new StreamTracer(manager, this.traceGroup, trace, logger)
  }

  private addEvent(event: TraceEvent) {
    this.trace.events.push(event)
    this.traceGroup.lastActivity = event.timestamp

    this.manager.updateTrace()
    this.manager.updateTraceGroup()
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
