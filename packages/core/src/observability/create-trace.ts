import { randomUUID } from 'crypto'
import type { Step } from '../types'
import type { Trace, TraceGroup } from './types'

export const createTrace = (traceGroup: TraceGroup, step: Step) => {
  const id = randomUUID()
  const trace: Trace = {
    id,
    name: step.config.name,
    correlationId: traceGroup.correlationId,
    parentTraceId: traceGroup.id,
    status: 'running',
    startTime: Date.now(),
    endTime: undefined,
    entryPoint: { type: step.config.type, stepName: step.config.name },
    events: [],
  }

  traceGroup.metadata.totalSteps++
  traceGroup.metadata.activeSteps++

  return trace
}
