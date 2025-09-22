import { Step } from '../types'
import { Trace, TraceGroup } from './types'
import { randomUUID } from 'crypto'

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
    entryPoint: { type: step.config.type || 'unknown', stepName: step.config.name },
    events: [],
  }

  traceGroup.metadata.totalSteps++
  traceGroup.metadata.activeSteps++

  return trace
}
