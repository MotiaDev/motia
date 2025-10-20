import type { QueueManager } from './queue-manager'
import type { Event, EventManager, Handler, SubscribeConfig, UnsubscribeConfig } from './types'
import type { EventAdapter, SubscriptionHandle } from './adapters/event-adapter'
import { DefaultQueueEventAdapter } from './adapters/default-queue-event-adapter'

type EventHandler = {
  filePath: string
  handler: Handler
}

export const createEventManager = (queueManager: QueueManager, eventAdapter?: EventAdapter): EventManager => {
  const adapter = eventAdapter || new DefaultQueueEventAdapter(queueManager)
  const handlers: Record<string, EventHandler[]> = {}
  const subscriptionHandles: Map<string, SubscriptionHandle> = new Map()

  const emit = async <TData>(event: Event<TData>, file?: string) => {
    await adapter.emit(event)
  }

  const subscribe = <TData>(config: SubscribeConfig<TData>) => {
    const { event, handler, filePath } = config

    if (!handlers[event]) {
      handlers[event] = []
    }

    handlers[event].push({ filePath, handler: handler as Handler })

    adapter.subscribe(event, handler as any).then((handle) => {
      subscriptionHandles.set(`${event}:${filePath}`, handle)
    })
  }

  const unsubscribe = (config: UnsubscribeConfig) => {
    const { filePath, event } = config
    const eventHandlers = handlers[event]
    if (!eventHandlers) {
      return
    }

    const handlerToRemove = eventHandlers.find((h) => h.filePath === filePath)
    if (handlerToRemove) {
      const handle = subscriptionHandles.get(`${event}:${filePath}`)
      if (handle) {
        adapter.unsubscribe(handle)
        subscriptionHandles.delete(`${event}:${filePath}`)
      }
    }

    handlers[event] = eventHandlers.filter((handler) => handler.filePath !== filePath)
  }

  return { emit, subscribe, unsubscribe }
}
