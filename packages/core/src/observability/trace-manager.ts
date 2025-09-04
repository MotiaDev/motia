import type { MotiaStream } from '../types-stream'
import type { Trace, TraceGroup } from './types'

export class TraceManager {
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
