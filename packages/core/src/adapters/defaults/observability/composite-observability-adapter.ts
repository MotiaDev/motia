import type { Logger } from '../../../logger'
import type { StateOperation, StreamOperation, TraceError } from '../../../observability/types'
import type { Step } from '../../../types'
import type { Metric, ObservabilityAdapter, Tracer } from '../../interfaces/observability-adapter.interface'

class CompositeTracer implements Tracer {
  constructor(private tracers: Tracer[]) {}

  end(err?: TraceError): void {
    for (const tracer of this.tracers) {
      tracer.end(err)
    }
  }

  stateOperation(operation: StateOperation, input: unknown): void {
    for (const tracer of this.tracers) {
      tracer.stateOperation(operation, input)
    }
  }

  emitOperation(topic: string, data: unknown, success: boolean): void {
    for (const tracer of this.tracers) {
      tracer.emitOperation(topic, data, success)
    }
  }

  streamOperation(streamName: string, operation: StreamOperation, input: unknown): void {
    for (const tracer of this.tracers) {
      tracer.streamOperation(streamName, operation, input)
    }
  }

  child(step: Step, logger: Logger): Tracer {
    const childTracers = this.tracers.map((tracer) => tracer.child(step, logger))
    return new CompositeTracer(childTracers)
  }
}

export class CompositeObservabilityAdapter implements ObservabilityAdapter {
  constructor(private adapters: ObservabilityAdapter[]) {}

  async createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const tracers = await Promise.all(this.adapters.map((adapter) => adapter.createTracer(traceId, step, logger)))
    return new CompositeTracer(tracers)
  }

  async attachToTrace(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const tracers = await Promise.all(this.adapters.map((adapter) => adapter.attachToTrace(traceId, step, logger)))
    return new CompositeTracer(tracers)
  }

  async clear(): Promise<void> {
    await Promise.all(this.adapters.map((adapter) => adapter.clear()))
  }

  async recordMetric(metric: Metric): Promise<void> {
    await Promise.all(
      this.adapters.map((adapter) => (adapter.recordMetric ? adapter.recordMetric(metric) : Promise.resolve())),
    )
  }
}

export const createCompositeObservabilityAdapter = (
  adapters: ObservabilityAdapter[],
): CompositeObservabilityAdapter => {
  return new CompositeObservabilityAdapter(adapters)
}
