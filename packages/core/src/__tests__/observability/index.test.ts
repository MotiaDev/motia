import { observabilityService } from '../../observability/observability-service'

describe('Observability Module Integration', () => {
  describe('Global observability service', () => {
    it('should be available as singleton', () => {
      expect(observabilityService).toBeDefined()
      expect(observabilityService.createObservabilityLogger).toBeInstanceOf(Function)
      expect(observabilityService.getTrace).toBeInstanceOf(Function)
      expect(observabilityService.searchTraces).toBeInstanceOf(Function)
    })

    it('should maintain state across calls', async () => {
      const logger1 = observabilityService.createObservabilityLogger(
        'global-test-1',
        ['integration-flow'],
        'test-step-1',
        false
      )

      const logger2 = observabilityService.createObservabilityLogger(
        'global-test-2',
        ['integration-flow'],
        'test-step-2',
        false
      )

      await logger1.logStepStart('step-1')
      await logger2.logStepStart('step-2')

      const traces = observabilityService.getAllTraces()
      const trace1 = observabilityService.getTrace('global-test-1')
      const trace2 = observabilityService.getTrace('global-test-2')

      expect(traces.length).toBeGreaterThanOrEqual(2)
      expect(trace1).toBeDefined()
      expect(trace2).toBeDefined()
      expect(trace1!.id).toBe('global-test-1')
      expect(trace2!.id).toBe('global-test-2')
    })

    it('should handle cross-trace correlation', async () => {
      const parentLogger = observabilityService.createObservabilityLogger(
        'parent-integration',
        ['integration-flow'],
        'parent-step',
        false
      )

      const childLogger = observabilityService.createObservabilityLogger(
        'child-integration',
        ['integration-flow'],
        'child-step',
        false
      )

      await parentLogger.logStepStart('parent-step')
      await parentLogger.logCorrelationStart('integration-correlation', 'automatic')

      await childLogger.logStepStart('child-step')
      await childLogger.logCorrelationContinue('integration-correlation', 'parent-integration')

      const group = observabilityService.getTraceGroup('integration-correlation')
      expect(group).toBeDefined()
      expect(group!.traces.length).toBeGreaterThanOrEqual(2)

      const childTrace = observabilityService.getTrace('child-integration')
      expect(childTrace!.correlationId).toBe('integration-correlation')
      expect(childTrace!.parentTraceId).toBe('parent-integration')
    })

    it('should provide comprehensive statistics', async () => {
      await observabilityService.createObservabilityLogger('stats-test-1', ['stats'], 'step1', false)
        .logStepStart('step1')

      await observabilityService.createObservabilityLogger('stats-test-2', ['stats'], 'step2', false)
        .logStepStart('step2')

      const stats = observabilityService.getStats()
      expect(stats.totalTraces).toBeGreaterThan(0)
      expect(stats.runningTraces).toBeGreaterThan(0)
    })
  })

  describe('End-to-End Workflow', () => {
    it('should handle complete workflow with multiple operations', async () => {
      const workflowId = 'e2e-workflow-test'
      const correlationId = 'e2e-correlation'

      const apiLogger = observabilityService.createObservabilityLogger(
        `${workflowId}-api`,
        ['e2e-flow'],
        'api-step',
        false
      )

      const processLogger = observabilityService.createObservabilityLogger(
        `${workflowId}-process`,
        ['e2e-flow'],
        'process-step',
        false
      )

      const notifyLogger = observabilityService.createObservabilityLogger(
        `${workflowId}-notify`,
        ['e2e-flow'],
        'notify-step',
        false
      )

      await apiLogger.logStepStart('api-step')
      await apiLogger.logCorrelationStart(correlationId, 'automatic', { workflowId })
      await apiLogger.logStateOperation('api-step', 'set', 'request-data', true)
      await apiLogger.logEmitOperation('api-step', 'data-received', true)
      await apiLogger.logStepEnd('api-step', 250, true)

      await processLogger.logStepStart('process-step')
      await processLogger.logCorrelationContinue(correlationId, `${workflowId}-api`)
      await processLogger.logStateOperation('process-step', 'get', 'request-data', true)
      await processLogger.logStateOperation('process-step', 'set', 'processed-data', true)
      await processLogger.logStreamOperation('process-step', 'audit-log', 'set', true)
      await processLogger.logEmitOperation('process-step', 'data-processed', true)
      await processLogger.logStepEnd('process-step', 800, true)

      await notifyLogger.logStepStart('notify-step')
      await notifyLogger.logCorrelationContinue(correlationId, `${workflowId}-api`)
      await notifyLogger.logStateOperation('notify-step', 'get', 'processed-data', true)
      await notifyLogger.logEmitOperation('notify-step', 'notification-sent', true)
      await notifyLogger.logStepEnd('notify-step', 150, true)

      const group = observabilityService.getTraceGroup(correlationId)
      expect(group).toBeDefined()
      expect(group!.traces).toHaveLength(3)
      expect(group!.status).toBe('completed')

      const apiTrace = observabilityService.getTraceWithDetails(`${workflowId}-api`)
      const processTrace = observabilityService.getTraceWithDetails(`${workflowId}-process`)
      const notifyTrace = observabilityService.getTraceWithDetails(`${workflowId}-notify`)

      expect(apiTrace!.status).toBe('completed')
      expect(processTrace!.status).toBe('completed')
      expect(notifyTrace!.status).toBe('completed')

      expect(apiTrace!.steps[0].details!.stateOperations).toHaveLength(1)
      expect(apiTrace!.steps[0].details!.emitOperations).toHaveLength(1)

      expect(processTrace!.steps[0].details!.stateOperations).toHaveLength(2)
      expect(processTrace!.steps[0].details!.emitOperations).toHaveLength(1)
      expect(processTrace!.steps[0].details!.streamOperations).toHaveLength(1)

      expect(notifyTrace!.steps[0].details!.stateOperations).toHaveLength(1)
      expect(notifyTrace!.steps[0].details!.emitOperations).toHaveLength(1)

      const searchResult = observabilityService.searchTraces({
        correlationId,
        status: 'completed'
      })
      expect(searchResult.traces).toHaveLength(3)
      expect(searchResult.groups).toHaveLength(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle failed steps and error propagation', async () => {
      const errorWorkflowId = 'error-workflow-test'
      const errorCorrelationId = 'error-correlation'

      const failingLogger = observabilityService.createObservabilityLogger(
        `${errorWorkflowId}-failing`,
        ['error-flow'],
        'failing-step',
        false
      )

      const recoveryLogger = observabilityService.createObservabilityLogger(
        `${errorWorkflowId}-recovery`,
        ['error-flow'],
        'recovery-step',
        false
      )

      await failingLogger.logStepStart('failing-step')
      await failingLogger.logCorrelationStart(errorCorrelationId, 'automatic')
      await failingLogger.logStateOperation('failing-step', 'get', 'missing-key', false)
      await failingLogger.logStepEnd('failing-step', 100, false, {
        message: 'Key not found',
        code: 'NOT_FOUND'
      })

      await recoveryLogger.logStepStart('recovery-step')
      await recoveryLogger.logCorrelationContinue(errorCorrelationId, `${errorWorkflowId}-failing`)
      await recoveryLogger.logStateOperation('recovery-step', 'set', 'default-value', true)
      await recoveryLogger.logStepEnd('recovery-step', 50, true)

      const group = observabilityService.getTraceGroup(errorCorrelationId)
      expect(group).toBeDefined()
      expect(group!.status).toBe('failed')

      const failingTrace = observabilityService.getTrace(`${errorWorkflowId}-failing`)
      const recoveryTrace = observabilityService.getTrace(`${errorWorkflowId}-recovery`)

      expect(failingTrace!.status).toBe('failed')
      expect(failingTrace!.metadata.errorCount).toBe(1)
      expect(failingTrace!.steps[0].status).toBe('failed')
      expect(failingTrace!.steps[0].error).toEqual({
        message: 'Key not found',
        code: 'NOT_FOUND'
      })

      expect(recoveryTrace!.status).toBe('completed')
      expect(recoveryTrace!.parentTraceId).toBe(`${errorWorkflowId}-failing`)
    })
  })
}) 