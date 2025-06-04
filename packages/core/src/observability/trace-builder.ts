import { ObservabilityEvent, Trace, TraceStep, TraceGroup, TraceFilter, TraceSearchResult, TraceStepDetails, StateOperation, EmitOperation, StreamOperation, LogEntry } from './types'

export class TraceBuilder {
  private traces = new Map<string, Trace>()
  private traceGroups = new Map<string, TraceGroup>()
  private stepDetails = new Map<string, Map<string, TraceStepDetails>>() // traceId -> stepName -> details
  private maxTraces = 50

  constructor(maxTraces: number = 50) {
    this.maxTraces = maxTraces
  }

  processEvent(event: ObservabilityEvent): void {
    switch (event.eventType) {
      case 'step_start':
        this.handleStepStart(event)
        break
      case 'step_end':
        this.handleStepEnd(event)
        break
      case 'state_op':
      case 'emit_op':
      case 'stream_op':
        this.handleOperation(event)
        break
      case 'correlation_start':
        this.handleCorrelationStart(event)
        break
      case 'correlation_continue':
        this.handleCorrelationContinue(event)
        break
    }

    this.evictOldTraces()
  }

  private handleStepStart(event: ObservabilityEvent): void {
    let trace = this.traces.get(event.traceId)
    
    if (!trace) {
      trace = this.createNewTrace(event)
      this.traces.set(event.traceId, trace)
      this.stepDetails.set(event.traceId, new Map())
    }

    const existingStep = trace.steps.find(s => s.name === event.stepName)
    if (!existingStep) {
      const step: TraceStep = {
        name: event.stepName,
        status: 'running',
        startTime: event.timestamp - trace.startTime,
        operations: { state: 0, emit: 0, stream: 0 }
      }
      trace.steps.push(step)
      trace.metadata.totalSteps = trace.steps.length

      // Initialize step details
      const traceStepDetails = this.stepDetails.get(event.traceId)!
      traceStepDetails.set(event.stepName, {
        stateOperations: [],
        emitOperations: [],
        streamOperations: [],
        logs: []
      })
    } else {
      existingStep.status = 'running'
      existingStep.startTime = event.timestamp - trace.startTime
      // Reset operation counts when step restarts
      existingStep.operations = { state: 0, emit: 0, stream: 0 }
      
      // Reset step details when step restarts
      const traceStepDetails = this.stepDetails.get(event.traceId)!
      traceStepDetails.set(event.stepName, {
        stateOperations: [],
        emitOperations: [],
        streamOperations: [],
        logs: []
      })
    }

    trace.status = 'running'
    this.updateTraceGroup(trace)
  }

  private handleStepEnd(event: ObservabilityEvent): void {
    const trace = this.traces.get(event.traceId)
    if (!trace) return

    const step = trace.steps.find(s => s.name === event.stepName)
    if (!step) return

    step.status = event.metadata?.success ? 'completed' : 'failed'
    step.duration = event.duration
    
    if (!event.metadata?.success) {
      trace.metadata.errorCount++
      if (event.metadata?.error) {
        step.error = event.metadata.error
      }
    }

    if (step.status === 'completed') {
      trace.metadata.completedSteps++
    }

    const allStepsCompleted = trace.steps.every(s => s.status === 'completed' || s.status === 'failed')
    if (allStepsCompleted) {
      trace.status = trace.metadata.errorCount > 0 ? 'failed' : 'completed'
      trace.duration = event.timestamp - trace.startTime
    }

    this.updateTraceGroup(trace)
  }

  private handleOperation(event: ObservabilityEvent): void {
    const trace = this.traces.get(event.traceId)
    if (!trace) return

    const step = trace.steps.find(s => s.name === event.stepName)
    if (!step) return

    const traceStepDetails = this.stepDetails.get(event.traceId)
    if (!traceStepDetails) return

    const stepDetails = traceStepDetails.get(event.stepName)
    if (!stepDetails) return

    switch (event.eventType) {
      case 'state_op':
        step.operations.state++
        const stateOp: StateOperation = {
          id: `${event.traceId}-${event.stepName}-state-${stepDetails.stateOperations.length}`,
          timestamp: event.timestamp,
          operation: event.metadata?.operation as any || 'get',
          key: event.metadata?.key,
          duration: event.duration,
          success: event.metadata?.success ?? true,
          error: event.metadata?.error
        }
        stepDetails.stateOperations.push(stateOp)
        break
      case 'emit_op':
        step.operations.emit++
        const emitOp: EmitOperation = {
          id: `${event.traceId}-${event.stepName}-emit-${stepDetails.emitOperations.length}`,
          timestamp: event.timestamp,
          topic: event.metadata?.topic || 'unknown',
          success: event.metadata?.success ?? true,
          error: event.metadata?.error
        }
        stepDetails.emitOperations.push(emitOp)
        break
      case 'stream_op':
        step.operations.stream++
        const streamOp: StreamOperation = {
          id: `${event.traceId}-${event.stepName}-stream-${stepDetails.streamOperations.length}`,
          timestamp: event.timestamp,
          operation: event.metadata?.operation as any || 'get',
          streamName: event.metadata?.streamName || 'unknown',
          duration: event.duration,
          success: event.metadata?.success ?? true,
          error: event.metadata?.error
        }
        stepDetails.streamOperations.push(streamOp)
        break
    }
  }

  private handleCorrelationStart(event: ObservabilityEvent): void {
    if (!event.correlationId) return

    const trace = this.traces.get(event.traceId)
    if (!trace) return

    trace.correlationId = event.correlationId

    let group = this.traceGroups.get(event.correlationId)
    if (!group) {
      group = this.createNewTraceGroup(event.correlationId, trace)
      this.traceGroups.set(event.correlationId, group)
    }

    if (!group.traces.find(t => t.id === trace.id)) {
      group.traces.push(trace)
      this.updateTraceGroupMetadata(group)
    }
  }

  private handleCorrelationContinue(event: ObservabilityEvent): void {
    if (!event.correlationId || !event.parentTraceId) return

    const trace = this.traces.get(event.traceId)
    if (!trace) return

    trace.correlationId = event.correlationId
    trace.parentTraceId = event.parentTraceId
    trace.metadata.isChildTrace = true

    const group = this.traceGroups.get(event.correlationId)
    if (group && !group.traces.find(t => t.id === trace.id)) {
      group.traces.push(trace)
      this.updateTraceGroupMetadata(group)
    }
  }

  private createNewTrace(event: ObservabilityEvent): Trace {
    const flowName = this.extractFlowName(event)
    const entryPointType = this.determineEntryPointType(event)

    return {
      id: event.traceId,
      correlationId: event.correlationId,
      parentTraceId: event.parentTraceId,
      flowName,
      status: 'running',
      startTime: event.timestamp,
      entryPoint: { type: entryPointType, stepName: event.stepName },
      steps: [],
      metadata: {
        totalSteps: 0,
        completedSteps: 0,
        errorCount: 0,
        isChildTrace: !!event.parentTraceId
      }
    }
  }

  private createNewTraceGroup(correlationId: string, initialTrace: Trace): TraceGroup {
    return {
      id: correlationId,
      correlationId,
      name: this.generateGroupName(initialTrace),
      status: 'active',
      startTime: initialTrace.startTime,
      lastActivity: initialTrace.startTime,
      traces: [initialTrace],
      metadata: {
        totalTraces: 1,
        completedTraces: 0,
        activeTraces: 1,
        totalSteps: 0,
        averageStepDuration: 0,
        gapsCount: 0,
        totalGapDuration: 0
      }
    }
  }

  private updateTraceGroup(trace: Trace): void {
    if (!trace.correlationId) return

    const group = this.traceGroups.get(trace.correlationId)
    if (!group) return

    group.lastActivity = Date.now()
    this.updateTraceGroupMetadata(group)
  }

  private updateTraceGroupMetadata(group: TraceGroup): void {
    const completedTraces = group.traces.filter(t => t.status === 'completed' || t.status === 'failed')
    const activeTraces = group.traces.filter(t => t.status === 'running')

    group.metadata.completedTraces = completedTraces.length
    group.metadata.activeTraces = activeTraces.length
    group.metadata.totalSteps = group.traces.reduce((sum, t) => sum + t.metadata.totalSteps, 0)

    if (completedTraces.length > 0) {
      const totalDuration = completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0)
      group.metadata.averageStepDuration = totalDuration / completedTraces.length
    }

    if (activeTraces.length === 0 && completedTraces.length > 0) {
      group.status = group.traces.some(t => t.status === 'failed') ? 'failed' : 'completed'
      group.totalDuration = group.lastActivity - group.startTime
    }
  }

  private extractFlowName(event: ObservabilityEvent): string {
    return event.stepName.split('-')[0] || 'unknown-flow'
  }

  private determineEntryPointType(event: ObservabilityEvent): 'api' | 'cron' | 'event' {
    if (event.stepName.includes('api') || event.stepName.includes('endpoint')) return 'api'
    if (event.stepName.includes('cron') || event.stepName.includes('schedule')) return 'cron'
    return 'event'
  }

  private generateGroupName(trace: Trace): string {
    return `${trace.flowName} Flow`
  }

  private evictOldTraces(): void {
    if (this.traces.size <= this.maxTraces) return

    const sortedTraces = Array.from(this.traces.entries())
      .sort(([, a], [, b]) => b.startTime - a.startTime)

    const tracesToRemove = sortedTraces.slice(this.maxTraces)
    tracesToRemove.forEach(([traceId]) => {
      this.traces.delete(traceId)
      this.stepDetails.delete(traceId) // Clean up step details
    })

    this.traceGroups.forEach((group, groupId) => {
      group.traces = group.traces.filter(trace => this.traces.has(trace.id))
      if (group.traces.length === 0) {
        this.traceGroups.delete(groupId)
      }
    })
  }

  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId)
  }

  getTraceGroup(correlationId: string): TraceGroup | undefined {
    return this.traceGroups.get(correlationId)
  }

  searchTraces(filter: TraceFilter = {}): TraceSearchResult {
    let traces = Array.from(this.traces.values())
    let groups = Array.from(this.traceGroups.values())

    if (filter.flowName) {
      traces = traces.filter(t => t.flowName.includes(filter.flowName!))
      groups = groups.filter(g => g.traces.some(t => t.flowName.includes(filter.flowName!)))
    }

    if (filter.status) {
      traces = traces.filter(t => t.status === filter.status)
      groups = groups.filter(g => g.status === filter.status)
    }

    if (filter.stepName) {
      traces = traces.filter(t => t.steps.some(s => s.name.includes(filter.stepName!)))
    }

    if (filter.correlationId) {
      traces = traces.filter(t => t.correlationId === filter.correlationId)
      groups = groups.filter(g => g.correlationId === filter.correlationId)
    }

    if (filter.startTime) {
      if (filter.startTime.from) {
        traces = traces.filter(t => t.startTime >= filter.startTime!.from!)
        groups = groups.filter(g => g.startTime >= filter.startTime!.from!)
      }
      if (filter.startTime.to) {
        traces = traces.filter(t => t.startTime <= filter.startTime!.to!)
        groups = groups.filter(g => g.startTime <= filter.startTime!.to!)
      }
    }

    traces.sort((a, b) => b.startTime - a.startTime)
    groups.sort((a, b) => b.lastActivity - a.lastActivity)

    const limit = filter.limit || 20
    const hasMore = traces.length > limit || groups.length > limit

    return {
      traces: traces.slice(0, limit),
      groups: groups.slice(0, limit),
      total: traces.length + groups.length,
      hasMore
    }
  }

  getAllTraces(): Trace[] {
    return Array.from(this.traces.values()).sort((a, b) => b.startTime - a.startTime)
  }

  getAllTraceGroups(): TraceGroup[] {
    return Array.from(this.traceGroups.values()).sort((a, b) => b.lastActivity - a.lastActivity)
  }

  getStats() {
    const traces = Array.from(this.traces.values())
    const groups = Array.from(this.traceGroups.values())

    return {
      totalTraces: traces.length,
      totalGroups: groups.length,
      runningTraces: traces.filter(t => t.status === 'running').length,
      completedTraces: traces.filter(t => t.status === 'completed').length,
      failedTraces: traces.filter(t => t.status === 'failed').length,
      averageDuration: traces.filter(t => t.duration).reduce((sum, t) => sum + t.duration!, 0) / traces.filter(t => t.duration).length || 0
    }
  }

  getTraceWithDetails(traceId: string): Trace | undefined {
    const trace = this.traces.get(traceId)
    if (!trace) return undefined

    const traceStepDetails = this.stepDetails.get(traceId)
    if (!traceStepDetails) return trace

    // Create a copy of the trace with details attached
    const traceWithDetails: Trace = {
      ...trace,
      steps: trace.steps.map(step => ({
        ...step,
        details: traceStepDetails.get(step.name)
      }))
    }

    return traceWithDetails
  }

  addLogEntry(traceId: string, stepName: string, logEntry: Omit<LogEntry, 'id'>): void {
    const traceStepDetails = this.stepDetails.get(traceId)
    if (!traceStepDetails) return

    const stepDetails = traceStepDetails.get(stepName)
    if (!stepDetails) return

    const fullLogEntry: LogEntry = {
      ...logEntry,
      id: `${traceId}-${stepName}-log-${stepDetails.logs.length}`
    }

    stepDetails.logs.push(fullLogEntry)
  }
} 