import { TraceBuilder } from '../../observability/trace-builder'
import { createMockObservabilityEvent } from '../fixtures/observability-fixtures'
import { ObservabilityEvent } from '../../observability/types'

describe('TraceBuilder', () => {
  let traceBuilder: TraceBuilder

  beforeEach(() => {
    traceBuilder = new TraceBuilder(10)
  })

  describe('constructor', () => {
    it('should initialize with correct max traces', () => {
      const builder = new TraceBuilder(5)
      expect(builder['maxTraces']).toBe(5)
    })

    it('should use default max traces if not provided', () => {
      const builder = new TraceBuilder()
      expect(builder['maxTraces']).toBe(50)
    })
  })

  describe('processEvent - step_start', () => {
    it('should create new trace and step on first step_start event', () => {
      const event = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 1000
      })

      traceBuilder.processEvent(event)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace).toBeDefined()
      expect(trace!.id).toBe('trace-1')
      expect(trace!.status).toBe('running')
      expect(trace!.steps).toHaveLength(1)
      expect(trace!.steps[0].name).toBe('api-step')
      expect(trace!.steps[0].status).toBe('running')
    })

    it('should add new step to existing trace', () => {
      const startEvent1 = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 1000
      })

      const startEvent2 = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'process-step',
        timestamp: 1500
      })

      traceBuilder.processEvent(startEvent1)
      traceBuilder.processEvent(startEvent2)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.steps).toHaveLength(2)
      expect(trace!.steps[1].name).toBe('process-step')
      expect(trace!.metadata.totalSteps).toBe(2)
    })

    it('should restart existing step if step_start received again', () => {
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 1000
      })

      const restartEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 2000
      })

      traceBuilder.processEvent(startEvent)
      traceBuilder.processEvent(restartEvent)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.steps).toHaveLength(1)
      expect(trace!.steps[0].status).toBe('running')
      expect(trace!.steps[0].operations).toEqual({ state: 0, emit: 0, stream: 0 })
    })
  })

  describe('processEvent - step_end', () => {
    it('should complete step successfully', () => {
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 1000
      })

      const endEvent = createMockObservabilityEvent({
        eventType: 'step_end',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 2000,
        duration: 1000,
        metadata: { success: true }
      })

      traceBuilder.processEvent(startEvent)
      traceBuilder.processEvent(endEvent)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].status).toBe('completed')
      expect(trace!.steps[0].duration).toBe(1000)
      expect(trace!.metadata.completedSteps).toBe(1)
      expect(trace!.status).toBe('completed')
    })

    it('should handle step failure', () => {
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 1000
      })

      const endEvent = createMockObservabilityEvent({
        eventType: 'step_end',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 2000,
        duration: 1000,
        metadata: { 
          success: false, 
          error: { message: 'Step failed', code: 500 }
        }
      })

      traceBuilder.processEvent(startEvent)
      traceBuilder.processEvent(endEvent)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].status).toBe('failed')
      expect(trace!.steps[0].error).toEqual({ message: 'Step failed', code: 500 })
      expect(trace!.metadata.errorCount).toBe(1)
      expect(trace!.status).toBe('failed')
    })

    it('should set trace duration when all steps complete', () => {
      const baseTime = 1000
      const events = [
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-1',
          stepName: 'step-1',
          timestamp: baseTime
        }),
        createMockObservabilityEvent({
          eventType: 'step_end',
          traceId: 'trace-1',
          stepName: 'step-1',
          timestamp: baseTime + 500,
          duration: 500,
          metadata: { success: true }
        })
      ]

      events.forEach(event => traceBuilder.processEvent(event))

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.duration).toBe(500)
      expect(trace!.status).toBe('completed')
    })
  })

  describe('processEvent - operations', () => {
    beforeEach(() => {
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: 1000
      })
      traceBuilder.processEvent(startEvent)
    })

    it('should handle state operations', () => {
      const stateEvent = createMockObservabilityEvent({
        eventType: 'state_op',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: 1500,
        metadata: { operation: 'set', key: 'test-key', success: true }
      })

      traceBuilder.processEvent(stateEvent)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].operations.state).toBe(1)

      const traceWithDetails = traceBuilder.getTraceWithDetails('trace-1')
      const stateOps = traceWithDetails!.steps[0].details!.stateOperations
      expect(stateOps).toHaveLength(1)
      expect(stateOps[0].operation).toBe('set')
      expect(stateOps[0].key).toBe('test-key')
      expect(stateOps[0].success).toBe(true)
    })

    it('should handle emit operations', () => {
      const emitEvent = createMockObservabilityEvent({
        eventType: 'emit_op',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: 1500,
        metadata: { topic: 'test-topic', success: true }
      })

      traceBuilder.processEvent(emitEvent)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].operations.emit).toBe(1)

      const traceWithDetails = traceBuilder.getTraceWithDetails('trace-1')
      const emitOps = traceWithDetails!.steps[0].details!.emitOperations
      expect(emitOps).toHaveLength(1)
      expect(emitOps[0].topic).toBe('test-topic')
      expect(emitOps[0].success).toBe(true)
    })

    it('should handle stream operations', () => {
      const streamEvent = createMockObservabilityEvent({
        eventType: 'stream_op',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: 1500,
        metadata: { streamName: 'test-stream', operation: 'get', success: true }
      })

      traceBuilder.processEvent(streamEvent)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.steps[0].operations.stream).toBe(1)

      const traceWithDetails = traceBuilder.getTraceWithDetails('trace-1')
      const streamOps = traceWithDetails!.steps[0].details!.streamOperations
      expect(streamOps).toHaveLength(1)
      expect(streamOps[0].streamName).toBe('test-stream')
      expect(streamOps[0].operation).toBe('get')
      expect(streamOps[0].success).toBe(true)
    })
  })

  describe('processEvent - correlation', () => {
    it('should handle correlation_start event', () => {
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'api-step',
        timestamp: 1000
      })

      const correlationEvent = createMockObservabilityEvent({
        eventType: 'correlation_start',
        traceId: 'trace-1',
        correlationId: 'corr-123',
        stepName: 'api-step',
        timestamp: 1100
      })

      traceBuilder.processEvent(startEvent)
      traceBuilder.processEvent(correlationEvent)

      const trace = traceBuilder.getTrace('trace-1')
      expect(trace!.correlationId).toBe('corr-123')

      const group = traceBuilder.getTraceGroup('corr-123')
      expect(group).toBeDefined()
      expect(group!.traces).toHaveLength(1)
      expect(group!.traces[0].id).toBe('trace-1')
    })

    it('should handle correlation_continue event', () => {
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-2',
        stepName: 'event-step',
        timestamp: 2000
      })

      const continueEvent = createMockObservabilityEvent({
        eventType: 'correlation_continue',
        traceId: 'trace-2',
        correlationId: 'corr-123',
        parentTraceId: 'trace-1',
        stepName: 'event-step',
        timestamp: 2100
      })

      traceBuilder.processEvent(startEvent)
      traceBuilder.processEvent(continueEvent)

      const trace = traceBuilder.getTrace('trace-2')
      expect(trace!.correlationId).toBe('corr-123')
      expect(trace!.parentTraceId).toBe('trace-1')
      expect(trace!.metadata.isChildTrace).toBe(true)
    })
  })

  describe('searchTraces', () => {
    beforeEach(() => {
      const events: ObservabilityEvent[] = [
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-1',
          stepName: 'user-api-step',
          timestamp: 1000
        }),
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-2',
          stepName: 'order-event-step',
          timestamp: 2000
        }),
        createMockObservabilityEvent({
          eventType: 'step_end',
          traceId: 'trace-1',
          stepName: 'user-api-step',
          timestamp: 1500,
          duration: 500,
          metadata: { success: true }
        })
      ]

      events.forEach(event => traceBuilder.processEvent(event))
    })

    it('should filter by flow name', () => {
      const result = traceBuilder.searchTraces({ flowName: 'user' })
      
      expect(result.traces).toHaveLength(1)
      expect(result.traces[0].id).toBe('trace-1')
    })

    it('should filter by status', () => {
      const result = traceBuilder.searchTraces({ status: 'completed' })
      
      expect(result.traces).toHaveLength(1)
      expect(result.traces[0].id).toBe('trace-1')
    })

    it('should filter by step name', () => {
      const result = traceBuilder.searchTraces({ stepName: 'api' })
      
      expect(result.traces).toHaveLength(1)
      expect(result.traces[0].id).toBe('trace-1')
    })

    it('should apply limit', () => {
      const result = traceBuilder.searchTraces({ limit: 1 })
      
      expect(result.traces).toHaveLength(1)
      expect(result.hasMore).toBe(true)
    })
  })

  describe('eviction', () => {
    it('should evict old traces when max limit exceeded', () => {
      const builder = new TraceBuilder(2)

      for (let i = 1; i <= 4; i++) {
        const event = createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: `trace-${i}`,
          stepName: `step-${i}`,
          timestamp: 1000 + i * 100
        })
        builder.processEvent(event)
      }

      const allTraces = builder.getAllTraces()
      expect(allTraces).toHaveLength(2)
      expect(allTraces.map(t => t.id)).toEqual(['trace-4', 'trace-3'])
      expect(builder.getTrace('trace-1')).toBeUndefined()
      expect(builder.getTrace('trace-2')).toBeUndefined()
    })
  })

  describe('getStats', () => {
    beforeEach(() => {
      const events: ObservabilityEvent[] = [
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-1',
          stepName: 'step-1',
          timestamp: 1000
        }),
        createMockObservabilityEvent({
          eventType: 'step_end',
          traceId: 'trace-1',
          stepName: 'step-1',
          timestamp: 1500,
          duration: 500,
          metadata: { success: true }
        }),
        createMockObservabilityEvent({
          eventType: 'step_start',
          traceId: 'trace-2',
          stepName: 'step-2',
          timestamp: 2000
        }),
        createMockObservabilityEvent({
          eventType: 'step_end',
          traceId: 'trace-2',
          stepName: 'step-2',
          timestamp: 2800,
          duration: 800,
          metadata: { success: false }
        })
      ]

      events.forEach(event => traceBuilder.processEvent(event))
    })

    it('should return correct statistics', () => {
      const stats = traceBuilder.getStats()
      
      expect(stats.totalTraces).toBe(2)
      expect(stats.completedTraces).toBe(1)
      expect(stats.failedTraces).toBe(1)
      expect(stats.runningTraces).toBe(0)
      expect(stats.averageDuration).toBe(650)
    })
  })

  describe('addLogEntry', () => {
    beforeEach(() => {
      const startEvent = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'test-step',
        timestamp: 1000
      })
      traceBuilder.processEvent(startEvent)
    })

    it('should add log entry to step details', () => {
      const logEntry = {
        timestamp: 1500,
        level: 'info' as const,
        message: 'Test log message',
        metadata: { key: 'value' }
      }

      traceBuilder.addLogEntry('trace-1', 'test-step', logEntry)

      const traceWithDetails = traceBuilder.getTraceWithDetails('trace-1')
      const logs = traceWithDetails!.steps[0].details!.logs
      
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
      expect(logs[0].message).toBe('Test log message')
      expect(logs[0].metadata).toEqual({ key: 'value' })
      expect(logs[0].id).toBe('trace-1-test-step-log-0')
    })
  })
}) 