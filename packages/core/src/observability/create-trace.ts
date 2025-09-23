import { Step } from '../types'
import { Trace, TraceGroup } from './types'
import { randomUUID } from 'crypto'
import { hasApiTrigger, hasEventTrigger, hasCronTrigger } from '../guards'

export const createTrace = (traceGroup: TraceGroup, step: Step) => {
  const id = randomUUID()

  // Determine primary trigger type using guard functions
  const primaryType = hasApiTrigger(step)
    ? 'api'
    : hasEventTrigger(step)
      ? 'event'
      : hasCronTrigger(step)
        ? 'cron'
        : step.config.triggers.length === 0
          ? 'noop'
          : 'multi'

  const trace: Trace = {
    id,
    name: step.config.name,
    correlationId: traceGroup.correlationId,
    parentTraceId: traceGroup.id,
    status: 'running',
    startTime: Date.now(),
    endTime: undefined,
    entryPoint: { type: primaryType, stepName: step.config.name },
    events: [],
  }

  traceGroup.metadata.totalSteps++
  traceGroup.metadata.activeSteps++

  return trace
}
