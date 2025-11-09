import { DefaultLogger } from '../../adapters/defaults/logger/default-logger-adapter'
import { NoTracer } from '../../observability/no-tracer'
import type { Event } from '../../types'

const logger = new DefaultLogger()
const tracer = new NoTracer()

export const createEvent = (event: Partial<Event> = {}): Event => ({
  topic: 'TEST_EVENT',
  data: { test: 'data' },
  traceId: '123',
  logger,
  tracer,
  ...event,
})
