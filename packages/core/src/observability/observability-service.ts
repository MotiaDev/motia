import { TraceBuilder } from './trace-builder'
import { ObservabilityStream } from './observability-stream'
import { ObservabilityLogger } from './observability-logger'
import { Trace, TraceGroup, TraceFilter, TraceSearchResult, ObservabilityEvent } from './types'
import { StateStream } from '../state-stream'

export class ObservabilityService {
  private traceBuilder: TraceBuilder
  private observabilityStream: ObservabilityStream

  constructor(maxTraces: number = 50) {
    this.traceBuilder = new TraceBuilder(maxTraces)
    this.observabilityStream = new ObservabilityStream()
    
    // Ensure all events are processed by the trace builder
    const originalSet = this.observabilityStream.set.bind(this.observabilityStream)
    this.observabilityStream.set = async (groupId: string, id: string, data: any) => {
      const result = await originalSet(groupId, id, data)
      if (result) {
        const observabilityEvent: ObservabilityEvent = {
          eventType: result.eventType,
          traceId: result.traceId,
          correlationId: result.correlationId,
          parentTraceId: result.parentTraceId,
          stepName: result.stepName,
          timestamp: result.timestamp,
          duration: result.duration,
          metadata: result.metadata
        }
        this.traceBuilder.processEvent(observabilityEvent)
      }
      return result
    }
  }

  createObservabilityLogger(
    traceId: string,
    flows: string[] | undefined,
    step: string,
    isVerbose: boolean,
    logStream?: StateStream<any>
  ): ObservabilityLogger {
    return new ObservabilityLogger(
      traceId,
      flows,
      step,
      isVerbose,
      logStream,
      this.observabilityStream
    )
  }

  getTrace(traceId: string): Trace | undefined {
    return this.traceBuilder.getTrace(traceId)
  }

  getTraceWithDetails(traceId: string) {
    return this.traceBuilder.getTraceWithDetails(traceId)
  }

  getTraceGroup(correlationId: string): TraceGroup | undefined {
    return this.traceBuilder.getTraceGroup(correlationId)
  }

  searchTraces(filter: TraceFilter = {}): TraceSearchResult {
    return this.traceBuilder.searchTraces(filter)
  }

  getAllTraces(): Trace[] {
    return this.traceBuilder.getAllTraces()
  }

  getAllTraceGroups(): TraceGroup[] {
    return this.traceBuilder.getAllTraceGroups()
  }

  getStats() {
    return this.traceBuilder.getStats()
  }

  getObservabilityStream(): ObservabilityStream {
    return this.observabilityStream
  }

  correlateTrace(traceId: string, correlationId: string, method: 'automatic' | 'manual' | 'state-based' | 'event-based' = 'manual', context?: any): void {
    const event: ObservabilityEvent = {
      eventType: 'correlation_start',
      traceId,
      correlationId,
      stepName: 'system',
      timestamp: Date.now(),
      metadata: {
        correlationMethod: method,
        correlationContext: context
      }
    }

    this.traceBuilder.processEvent(event)
  }

  continueCorrelation(traceId: string, correlationId: string, parentTraceId: string): void {
    const event: ObservabilityEvent = {
      eventType: 'correlation_continue',
      traceId,
      correlationId,
      parentTraceId,
      stepName: 'system',
      timestamp: Date.now()
    }

    this.traceBuilder.processEvent(event)
  }
}

export const observabilityService = new ObservabilityService() 