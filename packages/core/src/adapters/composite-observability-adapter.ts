import type { Logger } from '../logger'
import type { LogEntry, StateOperation, StreamOperation, Trace, TraceError } from '../observability/types'
import type { Step } from '../types'
import type { Metric, ObservabilityAdapter, Tracer } from './observability-adapter'

class CompositeTracer implements Tracer {
  constructor(
    private readonly primaryTracer: Tracer,
    private readonly adapters: ObservabilityAdapter[],
  ) {}

  end(err?: TraceError): void {
    this.primaryTracer.end(err)
  }

  stateOperation(operation: StateOperation, input: unknown): void {
    this.primaryTracer.stateOperation(operation, input)
  }

  emitOperation(topic: string, data: unknown, success: boolean): void {
    this.primaryTracer.emitOperation(topic, data, success)
  }

  streamOperation(streamName: string, operation: StreamOperation, input: unknown): void {
    this.primaryTracer.streamOperation(streamName, operation, input)
  }

  child(step: Step, logger: Logger): Tracer {
    const childTracer = this.primaryTracer.child(step, logger)
    return new CompositeTracer(childTracer, this.adapters)
  }
}

export class CompositeObservabilityAdapter implements ObservabilityAdapter {
  constructor(private readonly adapters: ObservabilityAdapter[]) {
    if (adapters.length === 0) {
      throw new Error('CompositeObservabilityAdapter requires at least one adapter')
    }
  }

  async createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const primaryTracer = await this.adapters[0].createTracer(traceId, step, logger)

    for (let i = 1; i < this.adapters.length; i++) {
      await this.adapters[i].createTracer(traceId, step, logger)
    }

    return new CompositeTracer(primaryTracer, this.adapters)
  }

  async attachToTrace(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const primaryTracer = await this.adapters[0].attachToTrace(traceId, step, logger)

    for (let i = 1; i < this.adapters.length; i++) {
      await this.adapters[i].attachToTrace(traceId, step, logger)
    }

    return new CompositeTracer(primaryTracer, this.adapters)
  }

  async clear(): Promise<void> {
    await Promise.all(this.adapters.map((adapter) => adapter.clear()))
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.adapters.map((adapter) => adapter.shutdown()))
  }

  async exportTrace(trace: Trace): Promise<void> {
    await Promise.all(
      this.adapters.filter((adapter) => adapter.exportTrace).map((adapter) => adapter.exportTrace!(trace)),
    )
  }

  async exportLog(log: LogEntry): Promise<void> {
    await Promise.all(this.adapters.filter((adapter) => adapter.exportLog).map((adapter) => adapter.exportLog!(log)))
  }

  async exportMetric(metric: Metric): Promise<void> {
    await Promise.all(
      this.adapters.filter((adapter) => adapter.exportMetric).map((adapter) => adapter.exportMetric!(metric)),
    )
  }
}

export const createCompositeObservabilityAdapter = (adapters: ObservabilityAdapter[]): ObservabilityAdapter => {
  return new CompositeObservabilityAdapter(adapters)
}
