import type { LockedData, Logger, ObservabilityAdapter, Step, Tracer } from '@motiadev/core'
import { createDefaultObservabilityAdapter } from '@motiadev/core'
import tracer from 'dd-trace'
import type { DatadogObservabilityAdapterConfig } from './types'

interface ResolvedDatadogConfig {
  apiKey: string
  service: string
  env: string
  version: string
  hostname?: string
  agentHost: string
  agentPort: number
  enableLogs: boolean
  enableTraces: boolean
  enableMetrics: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  sampleRate: number
  flushInterval: number
}

export class DatadogObservabilityAdapter implements ObservabilityAdapter {
  private config: ResolvedDatadogConfig
  private defaultAdapter: ObservabilityAdapter
  private ddTracer: typeof tracer
  private activeSpans: Map<string, any> = new Map()

  constructor(lockedData: LockedData, config: DatadogObservabilityAdapterConfig) {
    this.config = {
      apiKey: config.apiKey,
      service: config.service ?? 'motia-app',
      env: config.env ?? process.env.NODE_ENV ?? 'development',
      version: config.version ?? '1.0.0',
      hostname: config.hostname,
      agentHost: config.agentHost ?? 'localhost',
      agentPort: config.agentPort ?? 8126,
      enableLogs: config.enableLogs ?? true,
      enableTraces: config.enableTraces ?? true,
      enableMetrics: config.enableMetrics ?? true,
      logLevel: config.logLevel ?? 'info',
      sampleRate: config.sampleRate ?? 1.0,
      flushInterval: config.flushInterval ?? 2000,
    }

    this.defaultAdapter = createDefaultObservabilityAdapter(lockedData)

    if (this.config.enableTraces) {
      this.ddTracer = tracer.init({
        service: this.config.service,
        env: this.config.env,
        version: this.config.version,
        hostname: this.config.hostname,
        logInjection: this.config.enableLogs,
        sampleRate: this.config.sampleRate,
        url: `http://${this.config.agentHost}:${this.config.agentPort}`,
      })
    } else {
      this.ddTracer = tracer
    }
  }

  async createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const defaultTracer = await this.defaultAdapter.createTracer(traceId, step, logger)

    if (this.config.enableTraces) {
      const span = this.ddTracer.startSpan('motia.step', {
        resource: step.config.name,
        tags: {
          'motia.trace_id': traceId,
          'motia.step_name': step.config.name,
          'motia.step_type': step.config.type,
          'motia.flows': step.config.flows?.join(',') || '',
        },
      })

      this.activeSpans.set(traceId, span)

      return this.wrapTracer(defaultTracer, traceId, span)
    }

    return defaultTracer
  }

  async attachToTrace(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const defaultTracer = await this.defaultAdapter.attachToTrace(traceId, step, logger)

    if (this.config.enableTraces) {
      const parentSpan = this.activeSpans.get(traceId)
      const span = this.ddTracer.startSpan('motia.step', {
        childOf: parentSpan,
        resource: step.config.name,
        tags: {
          'motia.trace_id': traceId,
          'motia.step_name': step.config.name,
          'motia.step_type': step.config.type,
          'motia.flows': step.config.flows?.join(',') || '',
        },
      })

      return this.wrapTracer(defaultTracer, traceId, span)
    }

    return defaultTracer
  }

  private wrapTracer(defaultTracer: Tracer, traceId: string, span: any): Tracer {
    const originalEnd = defaultTracer.end.bind(defaultTracer)
    const originalStateOperation = defaultTracer.stateOperation.bind(defaultTracer)
    const originalEmitOperation = defaultTracer.emitOperation.bind(defaultTracer)
    const originalStreamOperation = defaultTracer.streamOperation.bind(defaultTracer)

    return {
      ...defaultTracer,
      end: (err?: any) => {
        if (err) {
          span.setTag('error', true)
          span.setTag('error.message', err.message)
          span.setTag('error.stack', err.stack)
        }
        span.finish()
        this.activeSpans.delete(traceId)
        originalEnd(err)
      },
      stateOperation: (operation: any, input: unknown) => {
        if (this.config.enableTraces) {
          const opSpan = this.ddTracer.startSpan('motia.state', {
            childOf: span,
            tags: {
              'motia.operation': operation,
              'motia.operation_type': 'state',
            },
          })
          opSpan.finish()
        }
        originalStateOperation(operation, input)
      },
      emitOperation: (topic: string, data: unknown, success: boolean) => {
        if (this.config.enableTraces) {
          const opSpan = this.ddTracer.startSpan('motia.emit', {
            childOf: span,
            tags: {
              'motia.topic': topic,
              'motia.success': success,
              'motia.operation_type': 'emit',
            },
          })
          opSpan.finish()
        }
        originalEmitOperation(topic, data, success)
      },
      streamOperation: (streamName: string, operation: any, input: unknown) => {
        if (this.config.enableTraces) {
          const opSpan = this.ddTracer.startSpan('motia.stream', {
            childOf: span,
            tags: {
              'motia.stream_name': streamName,
              'motia.operation': operation,
              'motia.operation_type': 'stream',
            },
          })
          opSpan.finish()
        }
        originalStreamOperation(streamName, operation, input)
      },
    }
  }

  async clear(): Promise<void> {
    await this.defaultAdapter.clear()
  }

  async shutdown(): Promise<void> {
    await this.defaultAdapter.shutdown()

    if (this.config.enableTraces) {
      await new Promise<void>((resolve) => {
        this.ddTracer.flush(() => {
          resolve()
        })
      })
    }
  }
}

export const createDatadogObservabilityAdapter = (
  lockedData: LockedData,
  config: DatadogObservabilityAdapterConfig,
): ObservabilityAdapter => {
  return new DatadogObservabilityAdapter(lockedData, config)
}
