import type { Logger } from '../logger'
import type { Step } from '../types'
import { createTrace } from './create-trace'
import type { Tracer } from './index'
import type { TraceManager } from './trace-manager'
import type { StateOperation, StreamOperation, Trace, TraceError, TraceEvent, TraceGroup } from './types'

export class StreamTracer implements Tracer {
  constructor(
    private readonly manager: TraceManager,
    private readonly traceGroup: TraceGroup,
    private readonly trace: Trace,
    logger: Logger,
  ) {
    logger.addListener(async (level, msg, args) => {
      await this.addEvent({
        type: 'log',
        timestamp: Date.now(),
        level,
        message: msg,
        metadata: args,
      })
    })
  }

  async end(err?: TraceError) {
    if (this.trace.endTime) {
      return
    }

    this.trace.status = err ? 'failed' : 'completed'
    this.trace.endTime = Date.now()
    this.trace.error = err

    await this.manager.updateTrace()
  }

  async stateOperation(operation: StateOperation, input: unknown) {
    await this.addEvent({
      type: 'state',
      timestamp: Date.now(),
      operation,
      data: input,
    })
  }

  async emitOperation(topic: string, data: unknown, success: boolean) {
    await this.addEvent({
      type: 'emit',
      timestamp: Date.now(),
      topic,
      success,
      data,
    })
  }

  async streamOperation(
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

        await this.manager.updateTrace()

        return
      }
    }

    await this.addEvent({
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

  private async addEvent(event: TraceEvent) {
    this.trace.events.push(event)

    await this.manager.updateTrace()
  }
}
