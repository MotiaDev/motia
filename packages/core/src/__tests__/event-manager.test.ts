import { DefaultQueueEventAdapter } from '../adapters/default-queue-event-adapter'
import { createEvent } from './fixtures/event-fixtures'

describe('EventManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle subscription, emission and unsubscription of events', async () => {
    const eventAdapter = new DefaultQueueEventAdapter()
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler = jest.fn().mockResolvedValue(undefined)

    await eventAdapter.emit(testEvent)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockHandler).toHaveBeenCalledWith(testEvent)
    expect(mockHandler).toHaveBeenCalledTimes(1)

    await eventAdapter.emit(testEvent)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple subscriptions to same event', async () => {
    const eventAdapter = new DefaultQueueEventAdapter()
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler1 = jest.fn().mockResolvedValue(undefined)
    const mockHandler2 = jest.fn().mockResolvedValue(undefined)

    await eventAdapter.emit(testEvent)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(mockHandler1).toHaveBeenCalledWith(testEvent)
    expect(mockHandler2).toHaveBeenCalledWith(testEvent)
  })
})
