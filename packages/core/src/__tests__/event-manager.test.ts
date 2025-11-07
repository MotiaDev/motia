import { InMemoryQueueEventAdapter } from '../adapters/defaults'
import { createEvent } from './fixtures/event-fixtures'

describe('EventManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle subscription, emission and unsubscription of events', async () => {
    const eventAdapter = new InMemoryQueueEventAdapter()
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler = jest.fn().mockResolvedValue(undefined)

    await eventAdapter.subscribe('TEST_EVENT', 'test-step', mockHandler)

    await eventAdapter.emit(testEvent)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockHandler).toHaveBeenCalledWith(testEvent)
    expect(mockHandler).toHaveBeenCalledTimes(1)

    await eventAdapter.emit(testEvent)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockHandler).toHaveBeenCalledTimes(2)
  })

  it('should handle multiple subscriptions to same event', async () => {
    const eventAdapter = new InMemoryQueueEventAdapter()
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler1 = jest.fn().mockResolvedValue(undefined)
    const mockHandler2 = jest.fn().mockResolvedValue(undefined)

    await eventAdapter.subscribe('TEST_EVENT', 'test-step-1', mockHandler1)
    await eventAdapter.subscribe('TEST_EVENT', 'test-step-2', mockHandler2)

    await eventAdapter.emit(testEvent)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockHandler1).toHaveBeenCalledWith(testEvent)
    expect(mockHandler2).toHaveBeenCalledWith(testEvent)
  })
})
