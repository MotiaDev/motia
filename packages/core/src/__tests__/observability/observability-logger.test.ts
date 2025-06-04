import { ObservabilityLogger } from '../../observability/observability-logger'
import { MockStateStream, MockObservabilityStream } from '../fixtures/observability-fixtures'

describe('ObservabilityLogger', () => {
  let logger: ObservabilityLogger
  let mockLogStream: MockStateStream<any>
  let mockObservabilityStream: MockObservabilityStream

  beforeEach(() => {
    mockLogStream = new MockStateStream<any>()
    mockObservabilityStream = new MockObservabilityStream()
    
    logger = new ObservabilityLogger(
      'test-trace-123',
      ['test-flow'],
      'test-step',
      false,
      mockLogStream,
      mockObservabilityStream
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(logger['observabilityTraceId']).toBe('test-trace-123')
      expect(logger['observabilityFlows']).toEqual(['test-flow'])
      expect(logger['observabilityStep']).toBe('test-step')
    })
  })

  describe('child', () => {
    it('should create a child logger with updated step', () => {
      const childLogger = logger.child({ step: 'child-step' })
      
      expect(childLogger['observabilityStep']).toBe('child-step')
      expect(childLogger['observabilityTraceId']).toBe('test-trace-123')
      expect(childLogger['observabilityFlows']).toEqual(['test-flow'])
    })
  })

  describe('logStepStart', () => {
    it('should emit step_start event and log info', async () => {
      const infoSpy = jest.spyOn(logger, 'info')
      
      await logger.logStepStart('test-step-name', 'correlation-123')
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'step_start',
            traceId: 'test-trace-123',
            correlationId: 'correlation-123',
            stepName: 'test-step-name',
            timestamp: expect.any(Number)
          })
        })
      )
      
      expect(infoSpy).toHaveBeenCalledWith('Step started: test-step-name')
    })

    it('should work without correlationId', async () => {
      await logger.logStepStart('test-step-name')
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'step_start',
            stepName: 'test-step-name',
            correlationId: undefined
          })
        })
      )
    })
  })

  describe('logStepEnd', () => {
    it('should emit step_end event for successful completion', async () => {
      const infoSpy = jest.spyOn(logger, 'info')
      
      await logger.logStepEnd('test-step-name', 1500, true)
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'step_end',
            traceId: 'test-trace-123',
            stepName: 'test-step-name',
            duration: 1500,
            metadata: { success: true, error: undefined }
          })
        })
      )
      
      expect(infoSpy).toHaveBeenCalledWith('Step completed: test-step-name (1500ms)')
    })

    it('should emit step_end event for failed completion', async () => {
      const errorSpy = jest.spyOn(logger, 'error')
      const error = { message: 'Test error', code: 500 }
      
      await logger.logStepEnd('test-step-name', 2000, false, error)
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'step_end',
            stepName: 'test-step-name',
            duration: 2000,
            metadata: { success: false, error }
          })
        })
      )
      
      expect(errorSpy).toHaveBeenCalledWith('Step failed: test-step-name (2000ms)', error)
    })
  })

  describe('logStateOperation', () => {
    it('should emit state_op event for successful operation', async () => {
      await logger.logStateOperation('test-step', 'set', 'test-key', true)
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'state_op',
            traceId: 'test-trace-123',
            stepName: 'test-step',
            metadata: { operation: 'set', key: 'test-key', success: true }
          })
        })
      )
    })

    it('should emit state_op event without key', async () => {
      await logger.logStateOperation('test-step', 'clear')
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'state_op',
            stepName: 'test-step',
            metadata: { operation: 'clear', key: undefined, success: true }
          })
        })
      )
    })
  })

  describe('logEmitOperation', () => {
    it('should emit emit_op event', async () => {
      await logger.logEmitOperation('test-step', 'test-topic', true)
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'emit_op',
            traceId: 'test-trace-123',
            stepName: 'test-step',
            metadata: { topic: 'test-topic', success: true }
          })
        })
      )
    })
  })

  describe('logStreamOperation', () => {
    it('should emit stream_op event', async () => {
      await logger.logStreamOperation('test-step', 'test-stream', 'get', true)
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'stream_op',
            traceId: 'test-trace-123',
            stepName: 'test-step',
            metadata: { streamName: 'test-stream', operation: 'get', success: true }
          })
        })
      )
    })
  })

  describe('logCorrelationStart', () => {
    it('should emit correlation_start event', async () => {
      const context = { userId: '123' }
      
      await logger.logCorrelationStart('correlation-456', 'manual', context)
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'correlation_start',
            traceId: 'test-trace-123',
            correlationId: 'correlation-456',
            stepName: 'test-step',
            metadata: { correlationMethod: 'manual', correlationContext: context }
          })
        })
      )
    })
  })

  describe('logCorrelationContinue', () => {
    it('should emit correlation_continue event', async () => {
      await logger.logCorrelationContinue('correlation-789', 'parent-trace-456')
      
      expect(mockObservabilityStream.getSendMock()).toHaveBeenCalledWith(
        { groupId: 'observability' },
        expect.objectContaining({
          type: 'observability_event',
          data: expect.objectContaining({
            eventType: 'correlation_continue',
            traceId: 'test-trace-123',
            correlationId: 'correlation-789',
            parentTraceId: 'parent-trace-456',
            stepName: 'test-step'
          })
        })
      )
    })
  })

  describe('without observability stream', () => {
    beforeEach(() => {
      logger = new ObservabilityLogger(
        'test-trace-123',
        ['test-flow'],
        'test-step',
        false,
        mockLogStream
      )
    })

    it('should not emit events when observability stream is not provided', async () => {
      await logger.logStepStart('test-step')
      
      expect(mockObservabilityStream.getSendMock()).not.toHaveBeenCalled()
    })
  })
}) 