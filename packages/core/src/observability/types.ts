import { StepConfig } from '../types'

export interface TraceGroup {
  id: string
  correlationId: string | undefined
  name: string
  status: 'active' | 'completed' | 'failed' | 'stalled'
  startTime: number
  endTime?: number
  lastActivity: number
  totalDuration?: number
  metadata: {
    totalTraces: number
    completedTraces: number
    activeTraces: number
    totalSteps: number
    averageStepDuration: number
  }
}

export interface Trace {
  id: string
  correlationId?: string
  parentTraceId?: string
  status: 'running' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  entryPoint: { type: StepConfig['type']; stepName: string }
  events: TraceEvent[]
  metadata: {
    totalSpans: number
    completedSpans: number
    errorCount: number
  }
}

export type TraceEvent = StateEvent | EmitEvent | StreamEvent | LogEntry

export type StateOperation = 'get' | 'getGroup' | 'set' | 'delete' | 'clear'
export type StreamOperation = 'get' | 'getGroup' | 'set' | 'delete' | 'clear' | 'send'

export interface StateEvent {
  type: 'state'
  timestamp: number
  operation: 'get' | 'getGroup' | 'set' | 'delete' | 'clear'
  key?: string
  duration?: number
  data: unknown
}

export interface EmitEvent {
  type: 'emit'
  timestamp: number
  topic: string
  success: boolean
  data: unknown
}

export interface StreamEvent {
  type: 'stream'
  timestamp: number
  operation: StreamOperation
  streamName: string
  duration?: number
  data: unknown
}

export interface LogEntry {
  type: 'log'
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: unknown
}
