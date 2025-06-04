import { ObservabilityService } from '../../observability/observability-service'
import { MockStateStream } from '../fixtures/observability-fixtures'

describe('ObservabilityService', () => {
  let service: ObservabilityService

  beforeEach(() => {
    service = new ObservabilityService(10)
  })

  describe('constructor', () => {
    it('should initialize with correct max traces', () => {
      const customService = new ObservabilityService(20)
      expect(customService['traceBuilder']['maxTraces']).toBe(20)
    })

    it('should use default max traces if not provided', () => {
      const defaultService = new ObservabilityService()
      expect(defaultService['traceBuilder']['maxTraces']).toBe(50)
    })
  })

  describe('createObservabilityLogger', () => {
    let mockLogStream: MockStateStream<any>

    beforeEach(() => {
      mockLogStream = new MockStateStream<any>()
    })

    it('should create logger with correct parameters', () => {
      const logger = service.createObservabilityLogger(
        'test-trace-123',
        ['test-flow'],
        'test-step',
        false,
        mockLogStream
      )

      expect(logger['observabilityTraceId']).toBe('test-trace-123')
      expect(logger['observabilityFlows']).toEqual(['test-flow'])
      expect(logger['observabilityStep']).toBe('test-step')
      expect(logger['isVerbose']).toBe(false)
    })

    it('should work without log stream', () => {
      const logger = service.createObservabilityLogger(
        'test-trace-456',
        ['test-flow'],
        'test-step',
        true
      )

      expect(logger).toBeDefined()
      expect(logger['observabilityTraceId']).toBe('test-trace-456')
    })
  })

  describe('getTrace', () => {
    it('should return undefined for non-existent trace', () => {
      const trace = service.getTrace('non-existent')
      expect(trace).toBeUndefined()
    })
  })

  describe('getTraceGroup', () => {
    it('should return undefined for non-existent group', () => {
      const group = service.getTraceGroup('non-existent')
      expect(group).toBeUndefined()
    })
  })

  describe('searchTraces', () => {
    it('should return empty results when no traces exist', () => {
      const result = service.searchTraces()
      expect(result.traces).toEqual([])
      expect(result.groups).toEqual([])
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('should apply limit correctly', () => {
      const result = service.searchTraces({ limit: 5 })
      expect(result.traces.length).toBeLessThanOrEqual(5)
    })
  })

  describe('getAllTraces', () => {
    it('should return empty array when no traces exist', () => {
      const traces = service.getAllTraces()
      expect(traces).toEqual([])
    })
  })

  describe('getAllTraceGroups', () => {
    it('should return empty array when no groups exist', () => {
      const groups = service.getAllTraceGroups()
      expect(groups).toEqual([])
    })
  })

  describe('getStats', () => {
    it('should return correct stats for empty service', () => {
      const stats = service.getStats()
      expect(stats.totalTraces).toBe(0)
      expect(stats.totalGroups).toBe(0)
      expect(stats.runningTraces).toBe(0)
      expect(stats.completedTraces).toBe(0)
      expect(stats.failedTraces).toBe(0)
    })
  })

  describe('getObservabilityStream', () => {
    it('should return the observability stream', () => {
      const stream = service.getObservabilityStream()
      expect(stream).toBeDefined()
    })
  })

  describe('manual correlation methods', () => {
    it('should create correlation manually', () => {
      service.correlateTrace('trace-123', 'correlation-456')

      const trace = service.getTrace('trace-123')
      expect(trace).toBeUndefined()
    })

    it('should create correlation with custom method and context', () => {
      const context = { userId: '123', sessionId: 'abc' }
      service.correlateTrace('trace-789', 'correlation-999', 'state-based', context)

      const trace = service.getTrace('trace-789')
      expect(trace).toBeUndefined()
    })

    it('should continue correlation', () => {
      service.correlateTrace('parent-trace', 'correlation-continue')
      service.continueCorrelation('child-trace', 'correlation-continue', 'parent-trace')

      const trace = service.getTrace('child-trace')
      expect(trace).toBeUndefined()
    })
  })

  describe('trace builder integration', () => {
    it('should process events when logger is used', async () => {
      const logger = service.createObservabilityLogger(
        'integration-trace',
        ['test-flow'],
        'test-step',
        false
      )

      await logger.logStepStart('test-step')

      const trace = service.getTrace('integration-trace')
      expect(trace).toBeDefined()
      expect(trace!.steps).toHaveLength(1)
      expect(trace!.steps[0].name).toBe('test-step')
    })

    it('should handle step lifecycle', async () => {
      const logger = service.createObservabilityLogger(
        'lifecycle-trace',
        ['test-flow'],
        'lifecycle-step',
        false
      )

      await logger.logStepStart('lifecycle-step')
      await logger.logStateOperation('lifecycle-step', 'set', 'test-key', true)
      await logger.logStepEnd('lifecycle-step', 100, true)

      const trace = service.getTraceWithDetails('lifecycle-trace')
      expect(trace).toBeDefined()
      expect(trace!.status).toBe('completed')
      expect(trace!.steps[0].status).toBe('completed')
      expect(trace!.steps[0].duration).toBe(100)
      expect(trace!.steps[0].details!.stateOperations).toHaveLength(1)
    })

    it('should handle correlation through logger', async () => {
      const parentLogger = service.createObservabilityLogger(
        'parent-correlation-trace',
        ['correlation-flow'],
        'parent-step',
        false
      )

      const childLogger = service.createObservabilityLogger(
        'child-correlation-trace',
        ['correlation-flow'],
        'child-step',
        false
      )

      await parentLogger.logStepStart('parent-step')
      await parentLogger.logCorrelationStart('test-correlation', 'manual')

      await childLogger.logStepStart('child-step')
      await childLogger.logCorrelationContinue('test-correlation', 'parent-correlation-trace')

      const group = service.getTraceGroup('test-correlation')
      expect(group).toBeDefined()
      expect(group!.traces.length).toBeGreaterThanOrEqual(1)

      const childTrace = service.getTrace('child-correlation-trace')
      expect(childTrace!.correlationId).toBe('test-correlation')
      expect(childTrace!.parentTraceId).toBe('parent-correlation-trace')
    })
  })
}) 