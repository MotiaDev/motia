import type { Event, EventManager, Handler, SubscribeConfig, UnsubscribeConfig } from './types'
import { QueueManager } from './queue-manager'
import { DEFAULT_QUEUE_CONFIG } from './infrastructure-validator/defaults'

type EventHandler = {
  filePath: string
  handler: Handler
}

export const createEventManager = (queueManager: QueueManager): EventManager => {
  const handlers: Record<string, EventHandler[]> = {}

  const emit = async <TData>(event: Event<TData>, file?: string) => {
    await queueManager.enqueue(event.topic, event, event.messageGroupId)
  }

  const subscribe = <TData>(config: SubscribeConfig<TData>) => {
    const { event, handler, filePath } = config

    if (!handlers[event]) {
      handlers[event] = []
    }

    handlers[event].push({ filePath, handler: handler as Handler })

    queueManager.subscribe(event, handler as Handler, DEFAULT_QUEUE_CONFIG, filePath)
  }

  const unsubscribe = (config: UnsubscribeConfig) => {
    const { filePath, event } = config
    const eventHandlers = handlers[event]
    if (!eventHandlers) {
      return
    }

    const handlerToRemove = eventHandlers.find((h) => h.filePath === filePath)
    if (handlerToRemove) {
      queueManager.unsubscribe(event, handlerToRemove.handler)
    }

    handlers[event] = eventHandlers.filter((handler) => handler.filePath !== filePath)
  }

  return { emit, subscribe, unsubscribe }
}
