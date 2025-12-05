import type { MotiaStream } from '../types-stream'
import type { Trace, TraceGroup } from './types'

const DEBOUNCE_DELAY_MS = 500

const noop = () => undefined

export class TraceManager {
  private traceDebounceTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly traceStream: MotiaStream<Trace>,
    private readonly traceGroupStream: MotiaStream<TraceGroup>,
    private readonly traceGroup: TraceGroup,
    private readonly trace: Trace,
  ) {
    this.updateTrace().catch(noop)
    this.updateTraceGroup().catch(noop)
  }

  async updateTrace() {
    if (this.traceDebounceTimer) {
      clearTimeout(this.traceDebounceTimer)
    }

    this.traceDebounceTimer = setTimeout(() => {
      this.traceDebounceTimer = null
      this.traceStream.set(this.traceGroup.id, this.trace.id, this.trace).catch(noop)
    }, DEBOUNCE_DELAY_MS)
  }

  async updateTraceGroup() {
    await this.traceGroupStream.set('default', this.traceGroup.id, this.traceGroup)
  }

  async flushTrace() {
    if (this.traceDebounceTimer) {
      clearTimeout(this.traceDebounceTimer)
      this.traceDebounceTimer = null
    }

    await this.traceStream.set(this.traceGroup.id, this.trace.id, this.trace)
  }

  async flush() {
    if (this.traceDebounceTimer) {
      clearTimeout(this.traceDebounceTimer)
      this.traceDebounceTimer = null
    }

    await Promise.all([
      this.traceStream.set(this.traceGroup.id, this.trace.id, this.trace),
      this.traceGroupStream.set('default', this.traceGroup.id, this.traceGroup),
    ])
  }

  async getAllTracesForGroup(): Promise<Trace[]> {
    return await this.traceStream.getGroup(this.traceGroup.id)
  }

  child(trace: Trace) {
    return new TraceManager(this.traceStream, this.traceGroupStream, this.traceGroup, trace)
  }
}
