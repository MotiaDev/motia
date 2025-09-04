import type { Event, EventManager, Handler, SubscribeConfig } from '@motiadev/core'

interface TestEventManager extends EventManager {
  waitEvents(): Promise<void>
}

export const createEventManager = (): TestEventManager => {
  const handlers: Record<string, Handler[]> = {}
  const events: Array<Promise<unknown>> = []

  const waitEvents = async () => {
    let eventsToAwait = [...events]

    // We need to wait for all events to be resolved because the event manager is async
    // and we need to ensure that all events have been processed before we can continue
    while (eventsToAwait.length > 0) {
      events.splice(0, eventsToAwait.length)
      await Promise.race([Promise.allSettled(eventsToAwait), new Promise((resolve) => setTimeout(resolve, 2000))])
      eventsToAwait = [...events]
    }
  }

  const emit = async <TData>(event: Event<TData>) => {
    const eventHandlers = handlers[event.topic] ?? []
    events.push(...eventHandlers.map((handler) => handler(event)))
  }

  const subscribe = <TData>(config: SubscribeConfig<TData>) => {
    const { event, handler } = config

    if (!handlers[event]) {
      handlers[event] = []
    }

    handlers[event].push(handler as Handler)
  }

  // We don't need to unsubscribe in the test environment
  const unsubscribe = () => {}

  return { emit, subscribe, waitEvents, unsubscribe }
}
