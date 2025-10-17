import { QueueManager, createEventManager as createProductionEventManager } from '@motiadev/core'
import type { Event, EventManager } from '@motiadev/core'

interface TestEventManager extends EventManager {
  waitEvents(): Promise<void>
  queueManager: QueueManager
}

export const createEventManager = (): TestEventManager => {
  const queueManager = new QueueManager()
  const productionEventManager = createProductionEventManager(queueManager)

  const waitEvents = async () => {
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Wait for all queue processing to complete
    let hasWork = true
    while (hasWork) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const metrics = queueManager.getAllMetrics()
      hasWork = Object.values(metrics).some(m => m.queueDepth > 0 || m.processingCount > 0)
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return {
    ...productionEventManager,
    waitEvents,
    queueManager
  }
}
