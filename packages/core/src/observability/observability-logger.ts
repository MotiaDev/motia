import { Logger } from '../logger'
import { ObservabilityEvent } from './types'
import { StateStream } from '../state-stream'

export class ObservabilityLogger extends Logger {
  private observabilityStream?: StateStream<ObservabilityEvent>
  protected readonly observabilityTraceId: string
  protected readonly observabilityFlows: string[] | undefined
  protected readonly observabilityStep: string

  constructor(
    traceId: string,
    flows: string[] | undefined,
    step: string,
    isVerbose: boolean,
    logStream?: StateStream<any>,
    observabilityStream?: StateStream<ObservabilityEvent>
  ) {
    super(traceId, flows, step, isVerbose, logStream)
    this.observabilityStream = observabilityStream
    this.observabilityTraceId = traceId
    this.observabilityFlows = flows
    this.observabilityStep = step
  }

  child(meta: Record<string, unknown> = {}): this {
    return new ObservabilityLogger(
      this.observabilityTraceId,
      this.observabilityFlows,
      meta.step as string,
      this.isVerbose,
      (this as any).logStream,
      this.observabilityStream
    ) as this
  }

  private emitObservabilityEvent(event: Omit<ObservabilityEvent, 'timestamp'>): void {
    if (!this.observabilityStream) return

    const observabilityEvent: ObservabilityEvent = {
      ...event,
      timestamp: Date.now()
    }

    this.observabilityStream.set('default', `${event.traceId}-${Date.now()}`, observabilityEvent)
  }

  logStepStart(stepName: string, correlationId?: string): void {
    this.emitObservabilityEvent({
      eventType: 'step_start',
      traceId: this.observabilityTraceId,
      correlationId,
      stepName
    })
    this.info(`Step started: ${stepName}`)
  }

  logStepEnd(stepName: string, duration: number, success: boolean, error?: { message: string, code?: string | number }): void {
    this.emitObservabilityEvent({
      eventType: 'step_end',
      traceId: this.observabilityTraceId,
      stepName,
      duration,
      metadata: { success, error }
    })
    
    if (success) {
      this.info(`Step completed: ${stepName} (${duration}ms)`)
    } else {
      this.error(`Step failed: ${stepName} (${duration}ms)`, error)
    }
  }

  logStateOperation(stepName: string, operation: 'get' | 'set' | 'delete' | 'clear', key?: string, success: boolean = true): void {
    this.emitObservabilityEvent({
      eventType: 'state_op',
      traceId: this.observabilityTraceId,
      stepName,
      metadata: { operation, key, success }
    })
  }

  logEmitOperation(stepName: string, topic: string, success: boolean = true): void {
    this.emitObservabilityEvent({
      eventType: 'emit_op',
      traceId: this.observabilityTraceId,
      stepName,
      metadata: { topic, success }
    })
  }

  logStreamOperation(stepName: string, streamName: string, operation: 'get' | 'set' | 'delete' | 'clear', success: boolean = true): void {
    this.emitObservabilityEvent({
      eventType: 'stream_op',
      traceId: this.observabilityTraceId,
      stepName,
      metadata: { streamName, operation, success }
    })
  }

  logCorrelationStart(correlationId: string, correlationMethod: 'automatic' | 'manual' | 'state-based' | 'event-based', context?: any): void {
    this.emitObservabilityEvent({
      eventType: 'correlation_start',
      traceId: this.observabilityTraceId,
      correlationId,
      stepName: this.observabilityStep,
      metadata: { correlationMethod, correlationContext: context }
    })
  }

  logCorrelationContinue(correlationId: string, parentTraceId: string): void {
    this.emitObservabilityEvent({
      eventType: 'correlation_continue',
      traceId: this.observabilityTraceId,
      correlationId,
      parentTraceId,
      stepName: this.observabilityStep
    })
  }
} 