import { 
  Trace, 
  TraceStep, 
  TraceGroup, 
  ObservabilityEvent, 
  TraceFilter, 
  TraceSearchResult,
  StateOperation,
  EmitOperation,
  StreamOperation,
  LogEntry,
  TraceStepDetails
} from '../../observability/types'

describe('Observability Types', () => {
  describe('Trace', () => {
    it('should create valid trace with required fields', () => {
      const trace: Trace = {
        id: 'trace-123',
        flowName: 'user-flow',
        status: 'running',
        startTime: Date.now(),
        entryPoint: { type: 'api', stepName: 'user-api' },
        steps: [],
        metadata: {
          totalSteps: 0,
          completedSteps: 0,
          errorCount: 0
        }
      }

      expect(trace.id).toBe('trace-123')
      expect(trace.status).toBe('running')
      expect(trace.entryPoint.type).toBe('api')
    })

    it('should create trace with optional fields', () => {
      const trace: Trace = {
        id: 'trace-456',
        correlationId: 'corr-123',
        parentTraceId: 'parent-789',
        flowName: 'order-flow',
        status: 'completed',
        startTime: 1000,
        duration: 2000,
        entryPoint: { type: 'event', stepName: 'order-event' },
        steps: [],
        metadata: {
          totalSteps: 2,
          completedSteps: 2,
          errorCount: 0,
          traceIndex: 1,
          isChildTrace: true,
          correlationContext: { userId: '123' }
        }
      }

      expect(trace.correlationId).toBe('corr-123')
      expect(trace.parentTraceId).toBe('parent-789')
      expect(trace.duration).toBe(2000)
      expect(trace.metadata.isChildTrace).toBe(true)
    })
  })

  describe('TraceStep', () => {
    it('should create valid trace step', () => {
      const step: TraceStep = {
        name: 'process-step',
        status: 'completed',
        startTime: 100,
        duration: 500,
        operations: { state: 2, emit: 1, stream: 0 },
        error: { message: 'Processing failed', code: 'PROC_ERR' }
      }

      expect(step.name).toBe('process-step')
      expect(step.status).toBe('completed')
      expect(step.operations.state).toBe(2)
      expect(step.error?.message).toBe('Processing failed')
    })

    it('should create step with details', () => {
      const details: TraceStepDetails = {
        stateOperations: [],
        emitOperations: [],
        streamOperations: [],
        logs: []
      }

      const step: TraceStep = {
        name: 'detailed-step',
        status: 'running',
        operations: { state: 0, emit: 0, stream: 0 },
        details
      }

      expect(step.details).toBeDefined()
      expect(step.details!.stateOperations).toEqual([])
    })
  })

  describe('TraceGroup', () => {
    it('should create valid trace group', () => {
      const group: TraceGroup = {
        id: 'group-123',
        correlationId: 'corr-123',
        name: 'User Registration Flow',
        status: 'completed',
        startTime: 1000,
        lastActivity: 3000,
        totalDuration: 2000,
        traces: [],
        metadata: {
          totalTraces: 3,
          completedTraces: 3,
          activeTraces: 0,
          totalSteps: 8,
          averageStepDuration: 250,
          gapsCount: 1,
          totalGapDuration: 100
        }
      }

      expect(group.correlationId).toBe('corr-123')
      expect(group.status).toBe('completed')
      expect(group.metadata.totalTraces).toBe(3)
    })
  })

  describe('ObservabilityEvent', () => {
    it('should create step_start event', () => {
      const event: ObservabilityEvent = {
        eventType: 'step_start',
        traceId: 'trace-123',
        stepName: 'api-step',
        timestamp: Date.now()
      }

      expect(event.eventType).toBe('step_start')
      expect(event.traceId).toBe('trace-123')
    })

    it('should create step_end event with metadata', () => {
      const event: ObservabilityEvent = {
        eventType: 'step_end',
        traceId: 'trace-456',
        stepName: 'process-step',
        timestamp: Date.now(),
        duration: 1500,
        metadata: {
          success: false,
          error: { message: 'Step failed', code: 500 }
        }
      }

      expect(event.eventType).toBe('step_end')
      expect(event.duration).toBe(1500)
      expect(event.metadata?.success).toBe(false)
    })

    it('should create operation events', () => {
      const stateEvent: ObservabilityEvent = {
        eventType: 'state_op',
        traceId: 'trace-789',
        stepName: 'data-step',
        timestamp: Date.now(),
        metadata: {
          operation: 'set',
          key: 'user-data',
          success: true
        }
      }

      const emitEvent: ObservabilityEvent = {
        eventType: 'emit_op',
        traceId: 'trace-789',
        stepName: 'notify-step',
        timestamp: Date.now(),
        metadata: {
          topic: 'user-created',
          success: true
        }
      }

      const streamEvent: ObservabilityEvent = {
        eventType: 'stream_op',
        traceId: 'trace-789',
        stepName: 'log-step',
        timestamp: Date.now(),
        metadata: {
          streamName: 'audit-log',
          operation: 'set',
          success: true
        }
      }

      expect(stateEvent.metadata?.operation).toBe('set')
      expect(emitEvent.metadata?.topic).toBe('user-created')
      expect(streamEvent.metadata?.streamName).toBe('audit-log')
    })

    it('should create correlation events', () => {
      const correlationStart: ObservabilityEvent = {
        eventType: 'correlation_start',
        traceId: 'trace-123',
        correlationId: 'corr-456',
        stepName: 'start-step',
        timestamp: Date.now(),
        metadata: {
          correlationMethod: 'automatic',
          correlationContext: { workflowId: 'wf-789' }
        }
      }

      const correlationContinue: ObservabilityEvent = {
        eventType: 'correlation_continue',
        traceId: 'trace-456',
        correlationId: 'corr-456',
        parentTraceId: 'trace-123',
        stepName: 'continue-step',
        timestamp: Date.now()
      }

      expect(correlationStart.correlationId).toBe('corr-456')
      expect(correlationStart.metadata?.correlationMethod).toBe('automatic')
      expect(correlationContinue.parentTraceId).toBe('trace-123')
    })
  })

  describe('Operation Types', () => {
    it('should create state operation', () => {
      const operation: StateOperation = {
        id: 'state-op-1',
        timestamp: Date.now(),
        operation: 'get',
        key: 'user-id',
        duration: 50,
        success: true,
        error: { message: 'Key not found', code: 'NOT_FOUND' }
      }

      expect(operation.operation).toBe('get')
      expect(operation.key).toBe('user-id')
      expect(operation.success).toBe(true)
    })

    it('should create emit operation', () => {
      const operation: EmitOperation = {
        id: 'emit-op-1',
        timestamp: Date.now(),
        topic: 'order-placed',
        success: true,
        targetSteps: ['inventory-step', 'payment-step'],
        error: { message: 'No subscribers', code: 'NO_SUBS' }
      }

      expect(operation.topic).toBe('order-placed')
      expect(operation.targetSteps).toEqual(['inventory-step', 'payment-step'])
    })

    it('should create stream operation', () => {
      const operation: StreamOperation = {
        id: 'stream-op-1',
        timestamp: Date.now(),
        operation: 'delete',
        streamName: 'temp-data',
        duration: 25,
        success: false,
        error: { message: 'Stream not found', code: 'STREAM_404' }
      }

      expect(operation.operation).toBe('delete')
      expect(operation.streamName).toBe('temp-data')
      expect(operation.success).toBe(false)
    })

    it('should create log entry', () => {
      const logEntry: LogEntry = {
        id: 'log-1',
        timestamp: Date.now(),
        level: 'warn',
        message: 'High memory usage detected',
        metadata: { memoryUsage: '85%', threshold: '80%' }
      }

      expect(logEntry.level).toBe('warn')
      expect(logEntry.message).toBe('High memory usage detected')
      expect(logEntry.metadata?.memoryUsage).toBe('85%')
    })
  })

  describe('Filter and Search Types', () => {
    it('should create trace filter', () => {
      const filter: TraceFilter = {
        flowName: 'user-flow',
        status: 'completed',
        stepName: 'api-step',
        correlationId: 'corr-123',
        startTime: { from: 1000, to: 2000 },
        limit: 50
      }

      expect(filter.flowName).toBe('user-flow')
      expect(filter.status).toBe('completed')
      expect(filter.startTime?.from).toBe(1000)
      expect(filter.limit).toBe(50)
    })

    it('should create search result', () => {
      const result: TraceSearchResult = {
        traces: [],
        groups: [],
        total: 25,
        hasMore: true
      }

      expect(result.traces).toEqual([])
      expect(result.total).toBe(25)
      expect(result.hasMore).toBe(true)
    })
  })

  describe('Type Safety', () => {
    it('should enforce status type constraints', () => {
      const validStatuses: Trace['status'][] = ['running', 'completed', 'failed']
      const validGroupStatuses: TraceGroup['status'][] = ['active', 'completed', 'failed', 'stalled']
      const validStepStatuses: TraceStep['status'][] = ['waiting', 'running', 'completed', 'failed']

      expect(validStatuses).toHaveLength(3)
      expect(validGroupStatuses).toHaveLength(4)
      expect(validStepStatuses).toHaveLength(4)
    })

    it('should enforce entry point type constraints', () => {
      const validEntryTypes: Trace['entryPoint']['type'][] = ['api', 'cron', 'event']
      expect(validEntryTypes).toHaveLength(3)
    })

    it('should enforce operation type constraints', () => {
      const stateOperations: StateOperation['operation'][] = ['get', 'set', 'delete', 'clear']
      const streamOperations: StreamOperation['operation'][] = ['get', 'set', 'delete']
      const logLevels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error']

      expect(stateOperations).toHaveLength(4)
      expect(streamOperations).toHaveLength(3)
      expect(logLevels).toHaveLength(4)
    })

    it('should enforce event type constraints', () => {
      const eventTypes: ObservabilityEvent['eventType'][] = [
        'step_start', 'step_end', 'state_op', 'emit_op', 'stream_op',
        'correlation_start', 'correlation_continue'
      ]
      expect(eventTypes).toHaveLength(7)
    })
  })
}) 