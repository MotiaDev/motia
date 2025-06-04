import { ObservabilityStream } from '../../observability/observability-stream'
import { createMockObservabilityEvent } from '../fixtures/observability-fixtures'

describe('ObservabilityStream', () => {
  let stream: ObservabilityStream

  beforeEach(() => {
    stream = new ObservabilityStream()
  })

  describe('set', () => {
    it('should set observability event and return stream item', async () => {
      const mockSend = jest.spyOn(stream, 'send').mockResolvedValue(undefined)
      const event = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'test-trace',
        stepName: 'test-step'
      })

      const result = await stream.set('default', 'event-1', event)

      expect(result).toEqual({
        id: 'event-1',
        ...event
      })

      expect(mockSend).toHaveBeenCalledWith(
        { groupId: 'observability' },
        {
          type: 'observability_event',
          data: {
            id: 'event-1',
            ...event
          }
        }
      )
    })

    it('should handle multiple events with different IDs', async () => {
      const mockSend = jest.spyOn(stream, 'send').mockResolvedValue(undefined)
      const event1 = createMockObservabilityEvent({
        eventType: 'step_start',
        traceId: 'trace-1',
        stepName: 'step-1'
      })
      const event2 = createMockObservabilityEvent({
        eventType: 'step_end',
        traceId: 'trace-1',
        stepName: 'step-1'
      })

      const result1 = await stream.set('group1', 'event-1', event1)
      const result2 = await stream.set('group2', 'event-2', event2)

      expect(result1!.id).toBe('event-1')
      expect(result2!.id).toBe('event-2')
      expect(mockSend).toHaveBeenCalledTimes(2)
    })
  })

  describe('get', () => {
    it('should return null', async () => {
      const result = await stream.get()
      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should return null', async () => {
      const result = await stream.delete()
      expect(result).toBeNull()
    })
  })

  describe('getGroup', () => {
    it('should return empty array', async () => {
      const result = await stream.getGroup()
      expect(result).toEqual([])
    })
  })

  describe('send error handling', () => {
    it('should handle send errors gracefully', async () => {
      const mockSend = jest.spyOn(stream, 'send').mockRejectedValue(new Error('Send failed'))
      const event = createMockObservabilityEvent()

      await expect(stream.set('default', 'event-1', event)).rejects.toThrow('Send failed')
    })
  })

  describe('event data integrity', () => {
    it('should preserve all event properties', async () => {
      const mockSend = jest.spyOn(stream, 'send').mockResolvedValue(undefined)
      const complexEvent = createMockObservabilityEvent({
        eventType: 'state_op',
        traceId: 'complex-trace',
        correlationId: 'correlation-123',
        parentTraceId: 'parent-trace',
        stepName: 'complex-step',
        timestamp: 1234567890,
        duration: 500,
        metadata: {
          operation: 'set',
          key: 'user-data',
          success: true,
          correlationContext: { userId: '123', sessionId: 'abc' }
        }
      })

      const result = await stream.set('group', 'complex-event', complexEvent)

      expect(result).toEqual({
        id: 'complex-event',
        eventType: 'state_op',
        traceId: 'complex-trace',
        correlationId: 'correlation-123',
        parentTraceId: 'parent-trace',
        stepName: 'complex-step',
        timestamp: 1234567890,
        duration: 500,
        metadata: {
          operation: 'set',
          key: 'user-data',
          success: true,
          correlationContext: { userId: '123', sessionId: 'abc' }
        }
      })

      expect(mockSend).toHaveBeenCalledWith(
        { groupId: 'observability' },
        {
          type: 'observability_event',
          data: result
        }
      )
    })
  })
}) 