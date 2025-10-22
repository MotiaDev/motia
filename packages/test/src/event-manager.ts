import type { Event, EventAdapter, EventManager, QueueMetrics } from '@motiadev/core'
import { createEventManager as createProductionEventManager, DefaultQueueEventAdapter } from '@motiadev/core'

interface TestEventManager extends EventManager {
  waitEvents(): Promise<void>
}

export const createEventManager = (eventAdapter: EventAdapter): TestEventManager => {
  const productionEventManager = createProductionEventManager(eventAdapter)

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

  return {
    ...productionEventManager,
    waitEvents,
  }
}
