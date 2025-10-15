import { Logger } from '../../logger'
import { NoTracer } from '../../observability/no-tracer'
import type { Event } from '../../types'

const logger = new Logger()
const tracer = new NoTracer()

export const createEvent = (event: Partial<Event> = {}): Event => ({
  topic: 'TEST_EVENT',
  data: { test: 'data' },
  traceId: '123',
  logger,
  tracer,
  ...event,
})
