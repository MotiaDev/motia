import type { LockedData, Logger, ObservabilityAdapter, Step, Tracer } from '@motiadev/core'
import { createDefaultObservabilityAdapter } from '@motiadev/core'
import newrelic from 'newrelic'
import type { NewRelicObservabilityAdapterConfig } from './types'

interface ResolvedNewRelicConfig {
  licenseKey: string
  appName: string
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
  enableLogs: boolean
  enableTraces: boolean
  enableMetrics: boolean
  distributedTracingEnabled: boolean
  transactionTracerEnabled: boolean
  errorCollectorEnabled: boolean
  customInsightsEvents: boolean
}

export class NewRelicObservabilityAdapter implements ObservabilityAdapter {
  private config: ResolvedNewRelicConfig
  private defaultAdapter: ObservabilityAdapter
  private activeTransactions: Map<string, any> = new Map()

  constructor(lockedData: LockedData, config: NewRelicObservabilityAdapterConfig) {
    this.config = {
      licenseKey: config.licenseKey,
      appName: config.appName ?? 'motia-app',
      logLevel: config.logLevel ?? 'info',
      enableLogs: config.enableLogs ?? true,
      enableTraces: config.enableTraces ?? true,
      enableMetrics: config.enableMetrics ?? true,
      distributedTracingEnabled: config.distributedTracingEnabled ?? true,
      transactionTracerEnabled: config.transactionTracerEnabled ?? true,
      errorCollectorEnabled: config.errorCollectorEnabled ?? true,
      customInsightsEvents: config.customInsightsEvents ?? true,
    }

    this.defaultAdapter = createDefaultObservabilityAdapter(lockedData)
  }

  async createTracer(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const defaultTracer = await this.defaultAdapter.createTracer(traceId, step, logger)

    if (this.config.enableTraces) {
      const transaction = newrelic.startWebTransaction(`motia/${step.config.name}`, () => {
        newrelic.addCustomAttributes({
          'motia.trace_id': traceId,
          'motia.step_name': step.config.name,
          'motia.step_type': step.config.type,
          'motia.flows': step.config.flows?.join(',') || '',
        })
      })

      this.activeTransactions.set(traceId, transaction)

      return this.wrapTracer(defaultTracer, traceId)
    }

    return defaultTracer
  }

  async attachToTrace(traceId: string, step: Step, logger: Logger): Promise<Tracer> {
    const defaultTracer = await this.defaultAdapter.attachToTrace(traceId, step, logger)

    if (this.config.enableTraces) {
      const parentTransaction = this.activeTransactions.get(traceId)

      if (parentTransaction) {
        newrelic.startSegment(`motia/${step.config.name}`, true, () => {
          newrelic.addCustomAttributes({
            'motia.trace_id': traceId,
            'motia.step_name': step.config.name,
            'motia.step_type': step.config.type,
            'motia.flows': step.config.flows?.join(',') || '',
          })
        })
      }

      return this.wrapTracer(defaultTracer, traceId)
    }

    return defaultTracer
  }

  private wrapTracer(defaultTracer: Tracer, traceId: string): Tracer {
    const originalEnd = defaultTracer.end.bind(defaultTracer)
    const originalStateOperation = defaultTracer.stateOperation.bind(defaultTracer)
    const originalEmitOperation = defaultTracer.emitOperation.bind(defaultTracer)
    const originalStreamOperation = defaultTracer.streamOperation.bind(defaultTracer)

    return {
      ...defaultTracer,
      end: (err?: any) => {
        if (err && this.config.errorCollectorEnabled) {
          newrelic.noticeError(err, {
            'motia.trace_id': traceId,
          })
        }

        const transaction = this.activeTransactions.get(traceId)
        if (transaction) {
          transaction.end()
          this.activeTransactions.delete(traceId)
        }

        originalEnd(err)
      },
      stateOperation: (operation: any, input: unknown) => {
        if (this.config.enableTraces) {
          newrelic.startSegment('motia.state', true, () => {
            newrelic.addCustomAttributes({
              'motia.operation': operation,
              'motia.operation_type': 'state',
            })
          })
        }
        originalStateOperation(operation, input)
      },
      emitOperation: (topic: string, data: unknown, success: boolean) => {
        if (this.config.enableTraces) {
          newrelic.startSegment('motia.emit', true, () => {
            newrelic.addCustomAttributes({
              'motia.topic': topic,
              'motia.success': success,
              'motia.operation_type': 'emit',
            })
          })
        }

        if (this.config.customInsightsEvents) {
          newrelic.recordCustomEvent('MotiaEmit', {
            topic,
            success,
            timestamp: Date.now(),
          })
        }

        originalEmitOperation(topic, data, success)
      },
      streamOperation: (streamName: string, operation: any, input: unknown) => {
        if (this.config.enableTraces) {
          newrelic.startSegment('motia.stream', true, () => {
            newrelic.addCustomAttributes({
              'motia.stream_name': streamName,
              'motia.operation': operation,
              'motia.operation_type': 'stream',
            })
          })
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
        newrelic.shutdown({ collectPendingData: true }, () => {
          resolve()
        })
      })
    }
  }
}

export const createNewRelicObservabilityAdapter = (
  lockedData: LockedData,
  config: NewRelicObservabilityAdapterConfig,
): ObservabilityAdapter => {
  return new NewRelicObservabilityAdapter(lockedData, config)
}
