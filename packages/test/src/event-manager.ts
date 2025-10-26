import type { Event, EventAdapter, QueueMetrics } from '@motiadev/core'
import { DefaultQueueEventAdapter } from '@motiadev/core'

interface TestEventManager {
  emit: <TData>(event: Event<TData>, file?: string) => Promise<void>
  waitEvents(): Promise<void>
  subscribe: <TData>(topic: string, stepName: string, handler: (event: Event<TData>) => void | Promise<void>) => void
}

export const createEventManager = (eventAdapter: EventAdapter): TestEventManager => {
  const waitEvents = async () => {
    await new Promise((resolve) => setTimeout(resolve, 200))

    if (eventAdapter instanceof DefaultQueueEventAdapter) {
      let hasWork = true
      while (hasWork) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        const metrics: Record<string, QueueMetrics> = eventAdapter.getAllMetrics()
        hasWork = Object.values(metrics).some((m) => m.queueDepth > 0 || m.processingCount > 0)
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const subscribe = <TData>(
    topic: string,
    stepName: string,
    handler: (event: Event<TData>) => void | Promise<void>,
  ) => {
    eventAdapter.subscribe(topic, stepName, handler)
  }

  return {
    emit: eventAdapter.emit,
    waitEvents,
    subscribe,
  }
}
