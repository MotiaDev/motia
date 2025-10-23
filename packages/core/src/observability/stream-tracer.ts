import type { Logger } from '../logger'
import type { Step } from '../types'
import type { Tracer } from '.'
import { createTrace } from './create-trace'
import type { TraceManager } from './trace-manager'
import type { StateOperation, StreamOperation, Trace, TraceError, TraceEvent, TraceGroup } from './types'

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

  end(err?: TraceError) {
    if (this.trace.endTime) {
      // avoiding updating twice
      return
    }

    this.trace.status = err ? 'failed' : 'completed'
    this.trace.endTime = Date.now()
    this.trace.error = err

    this.traceGroup.metadata.completedSteps++
    this.traceGroup.metadata.activeSteps--

    if (this.traceGroup.metadata.activeSteps === 0) {
      if (this.traceGroup.status === 'running') {
        this.traceGroup.status = 'completed'
      }
      this.traceGroup.endTime = Date.now()
    }

    if (err) {
      this.traceGroup.status = 'failed'
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
