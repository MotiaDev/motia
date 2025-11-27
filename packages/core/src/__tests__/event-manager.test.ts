import { createEventManager } from '../event-manager'
import { createEvent } from './fixtures/event-fixtures'

describe('EventManager', () => {
  it('should handle subscription, emission and unsubscription of events', async () => {
    const eventManager = createEventManager()
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler = jest.fn()

    eventManager.subscribe({
      event: 'TEST_EVENT',
      handlerName: 'testHandler',
      filePath: 'test.ts',
      handler: mockHandler,
    })

    await eventManager.emit(testEvent)

    expect(mockHandler).toHaveBeenCalledWith(testEvent)
    expect(mockHandler).toHaveBeenCalledTimes(1)

    eventManager.unsubscribe({ event: 'TEST_EVENT', filePath: 'test.ts' })

    await eventManager.emit(testEvent)

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple subscriptions to same event', async () => {
    const eventManager = createEventManager()
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler1 = jest.fn()
    const mockHandler2 = jest.fn()

    eventManager.subscribe({
      event: 'TEST_EVENT',
      handlerName: 'handler1',
      filePath: 'test1.ts',
      handler: mockHandler1,
    })

    eventManager.subscribe({
      event: 'TEST_EVENT',
      handlerName: 'handler2',
      filePath: 'test2.ts',
      handler: mockHandler2,
    })

    await eventManager.emit(testEvent)

    expect(mockHandler1).toHaveBeenCalledWith(testEvent)
    expect(mockHandler2).toHaveBeenCalledWith(testEvent)
  })
})
