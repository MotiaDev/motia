import type { EventAdapter, ObservabilityAdapter } from '../interfaces'
import type { CronAdapter } from '../interfaces/cron-adapter.interface'
import type { StreamAdapterManager } from '../interfaces/stream-adapter-manager.interface'
import { InMemoryCronAdapter } from './cron/in-memory-cron-adapter'
import { InMemoryQueueEventAdapter } from './event/in-memory-queue-event-adapter'
import { DefaultLoggerAdapter } from './logger/default-logger-adapter'
import { FileStreamAdapterManager } from './stream/file-stream-adapter-manager'

export type AdapterOptions = {
  eventAdapter: EventAdapter
  cronAdapter: CronAdapter
  streamAdapter: StreamAdapterManager
  observabilityAdapter: ObservabilityAdapter
}

export const defaultAdapterOptions = {
  eventAdapter: new InMemoryQueueEventAdapter(),
  cronAdapter: new InMemoryCronAdapter(),
  streamAdapter: new FileStreamAdapterManager(process.cwd()),
  observabilityAdapter: {
    loggerAdapter: new DefaultLoggerAdapter(),
  },
}
