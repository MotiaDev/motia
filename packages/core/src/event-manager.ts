import { Event, EventManager, Handler, SubscribeConfig, UnsubscribeConfig } from './types'
import { queueManager } from './queue-manager'

type EventHandler = {
  filePath: string
  handler: Handler
}

export const createEventManager = (): EventManager => {
  const handlers: Record<string, EventHandler[]> = {}

  const emit = async <TData>(event: Event<TData>, file?: string) => {
    await queueManager.enqueue(event.topic, event)
  }

  const subscribe = <TData>(config: SubscribeConfig<TData>) => {
    const { event, handler, filePath } = config

    if (!handlers[event]) {
      handlers[event] = []
    }

    handlers[event].push({ filePath, handler: handler as Handler })
  }

  const unsubscribe = (config: UnsubscribeConfig) => {
    const { filePath, event } = config
    handlers[event] = handlers[event]?.filter((handler) => handler.filePath !== filePath)
  }

  return { emit, subscribe, unsubscribe }
}
