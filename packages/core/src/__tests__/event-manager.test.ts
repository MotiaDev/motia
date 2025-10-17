import { createEventManager } from '../event-manager'
import { QueueManager } from '../queue-manager'
import { createEvent } from './fixtures/event-fixtures'

describe('EventManager', () => {
  let queueManager: QueueManager

  beforeEach(() => {
    queueManager = new QueueManager()
  })

  afterEach(() => {
    queueManager.reset()
  })

  it('should handle subscription, emission and unsubscription of events', async () => {
    const eventManager = createEventManager(queueManager)
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler = jest.fn().mockResolvedValue(undefined)

    eventManager.subscribe({
      event: 'TEST_EVENT',
      handlerName: 'testHandler',
      filePath: 'test.ts',
      handler: mockHandler,
    })

    await eventManager.emit(testEvent)
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockHandler).toHaveBeenCalledWith(testEvent)
    expect(mockHandler).toHaveBeenCalledTimes(1)

    eventManager.unsubscribe({ event: 'TEST_EVENT', filePath: 'test.ts' })

    await eventManager.emit(testEvent)
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple subscriptions to same event', async () => {
    const eventManager = createEventManager(queueManager)
    const testEvent = createEvent({ topic: 'TEST_EVENT' })

    const mockHandler1 = jest.fn().mockResolvedValue(undefined)
    const mockHandler2 = jest.fn().mockResolvedValue(undefined)

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
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockHandler1).toHaveBeenCalledWith(testEvent)
    expect(mockHandler2).toHaveBeenCalledWith(testEvent)
  })
})
