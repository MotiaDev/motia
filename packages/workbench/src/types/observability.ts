export interface Trace {
  id: string
  correlationId?: string
  parentTraceId?: string
  flowName: string
  status: 'running' | 'completed' | 'failed'
  startTime: number
  duration?: number
  entryPoint: { type: 'api' | 'cron' | 'event', stepName: string }
  steps: TraceStep[]
  metadata: { 
    totalSteps: number
    completedSteps: number
    errorCount: number
    traceIndex?: number
    isChildTrace?: boolean
    correlationContext?: any
  }
}

export interface TraceStep {
  name: string
  status: 'waiting' | 'running' | 'completed' | 'failed'
  startTime?: number
  duration?: number
  operations: { state: number, emit: number, stream: number }
  error?: { message: string, code?: string | number }
  details?: TraceStepDetails
}

export interface TraceStepDetails {
  stateOperations: StateOperation[]
  emitOperations: EmitOperation[]
  streamOperations: StreamOperation[]
  logs: LogEntry[]
}

export interface StateOperation {
  id: string
  timestamp: number
  operation: 'get' | 'set' | 'delete' | 'clear'
  key?: string
  duration?: number
  success: boolean
  error?: { message: string, code?: string | number }
}

export interface EmitOperation {
  id: string
  timestamp: number
  topic: string
  success: boolean
  targetSteps?: string[]
  error?: { message: string, code?: string | number }
}

export interface StreamOperation {
  id: string
  timestamp: number
  operation: 'get' | 'set' | 'delete'
  streamName: string
  duration?: number
  success: boolean
  error?: { message: string, code?: string | number }
}

export interface LogEntry {
  id: string
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: any
}

export interface TraceGroup {
  id: string
  correlationId: string
  name: string
  status: 'active' | 'completed' | 'failed' | 'stalled'
  startTime: number
  lastActivity: number
  totalDuration?: number
  traces: Trace[]
  metadata: {
    totalTraces: number
    completedTraces: number
    activeTraces: number
    totalSteps: number
    averageStepDuration: number
    gapsCount: number
    totalGapDuration: number
  }
}

export interface TraceFilter {
  flowName?: string
  status?: Trace['status']
  stepName?: string
  correlationId?: string
  startTime?: { from?: number, to?: number }
  limit?: number
}

export interface TraceSearchResult {
  traces: Trace[]
  groups: TraceGroup[]
  total: number
  hasMore: boolean
}

export interface ObservabilityStats {
  totalTraces: number
  totalGroups: number
  runningTraces: number
  completedTraces: number
  failedTraces: number
  averageDuration: number
} 