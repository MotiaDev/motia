import { useState, useEffect, useCallback } from 'react'

export interface ExecutionTrace {
  id: string
  flowNames: string[]
  status: 'running' | 'completed' | 'failed' | 'partial'
  startTime: number
  endTime?: number
  duration?: number
  totalSteps: number
  errorCount: number
  
  entryPoint: {
    type: 'api' | 'cron' | 'event'
    stepName: string
    endpoint?: string
    cronExpression?: string
    eventTopic?: string
  }
  
  steps: StepExecution[]
  stateOperations: StateOperation[]
  emitOperations: EmitOperation[]
  streamOperations: StreamOperation[]
  stepInteractions: StepInteraction[]
  
  metrics: ExecutionMetrics
  logs: Log[]
  lastUpdated: number
}

export interface StepExecution {
  stepName: string
  stepType: 'api' | 'event' | 'cron' | 'noop'
  filePath: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime: number
  endTime?: number
  duration?: number
  
  input?: any
  output?: any
  
  error?: {
    message: string
    stack?: string
    code?: string | number
  }
  
  metrics: {
    memoryUsage?: number
    cpuTime?: number
    externalCalls?: number
    stateOperationsCount: number
    emitOperationsCount: number
    streamOperationsCount: number
  }
  
  language: 'typescript' | 'javascript' | 'python' | 'ruby'
  processInfo?: {
    pid: number
    startTime: number
    endTime?: number
  }
  
  stateOperations: string[]
  emitOperations: string[]
  streamOperations: string[]
}

export interface StateOperation {
  id: string
  traceId: string
  stepName: string
  operation: 'get' | 'set' | 'delete' | 'clear' | 'getGroup'
  key?: string
  groupId?: string
  value?: any
  result?: any
  startTime: number
  duration: number
  success: boolean
  error?: string
}

export interface EmitOperation {
  id: string
  traceId: string
  stepName: string
  eventTopic: string
  eventData: any
  targetSteps: string[]
  startTime: number
  success: boolean
  error?: string
  
  triggerChain: {
    triggeredSteps: string[]
    propagationTime: number
  }
}

export interface StreamOperation {
  id: string
  traceId: string
  stepName: string
  streamName: string
  operation: 'get' | 'set' | 'delete' | 'getGroup'
  groupId: string
  itemId?: string
  data?: any
  result?: any
  startTime: number
  duration: number
  success: boolean
  error?: string
}

export interface StepInteraction {
  id: string
  traceId: string
  sourceStep: string
  targetStep: string
  eventTopic: string
  eventData: any
  emitTime: number
  executionTime?: number
  propagationDelay: number
  success: boolean
  error?: string
}

export interface ExecutionMetrics {
  totalDuration: number
  stepCount: number
  averageStepDuration: number
  slowestStep: string
  errorRate: number
  
  stateOperationsCount: number
  emitOperationsCount: number
  streamOperationsCount: number
  averageStateOperationTime: number
  averageStreamOperationTime: number
  mostAccessedStateKeys: string[]
  mostUsedEventTopics: string[]
  mostActiveStreams: string[]
}

export interface Log {
  id: string
  level: string
  time: number
  msg: string
  traceId: string
  flows: string[]
  [key: string]: any
}

export interface TraceFilters {
  flow?: string
  status?: 'running' | 'completed' | 'failed' | 'partial'
  timeRange?: string
  limit?: number
  
  stateKey?: string
  eventTopic?: string
  streamName?: string
  stepName?: string
  hasStateOperations?: boolean
  hasEmitOperations?: boolean
  hasStreamOperations?: boolean
  stepInteractionSource?: string
  stepInteractionTarget?: string
}

// Main hook for fetching execution trace data
export const useExecutionTrace = (traceId: string | null) => {
  const [trace, setTrace] = useState<ExecutionTrace | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrace = useCallback(async (id: string) => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/motia/traces/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch trace: ${response.status}`)
      }

      const traceData = await response.json()
      setTrace(traceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTrace(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (traceId) {
      fetchTrace(traceId)
    } else {
      setTrace(null)
      setError(null)
    }
  }, [traceId, fetchTrace])

  return { trace, loading, error, refetch: () => traceId && fetchTrace(traceId) }
}

// Hook for fetching multiple traces with filters
export const useExecutionTraces = (filters: TraceFilters = {}) => {
  const [traces, setTraces] = useState<ExecutionTrace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTraces = useCallback(async (currentFilters: TraceFilters) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })

      const response = await fetch(`/motia/traces?${queryParams}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch traces: ${response.status}`)
      }

      const tracesData = await response.json()
      setTraces(tracesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTraces([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTraces(filters)
  }, [fetchTraces, JSON.stringify(filters)])

  return { traces, loading, error, refetch: () => fetchTraces(filters) }
}

// Hook for real-time trace updates
export const useRealtimeTrace = (traceId: string | null) => {
  const [trace, setTrace] = useState<ExecutionTrace | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!traceId) return

    const ws = new WebSocket(`ws://localhost:3000/motia/traces/${traceId}/stream`)

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        
        if (update.type === 'trace-update') {
          setTrace(update.trace)
        } else if (update.type === 'step-update') {
          setTrace(prevTrace => {
            if (!prevTrace) return null
            
            const updatedSteps = prevTrace.steps.map(step => 
              step.stepName === update.step.stepName ? { ...step, ...update.step } : step
            )
            
            return { ...prevTrace, steps: updatedSteps, lastUpdated: Date.now() }
          })
        } else if (update.type === 'operation-update') {
          setTrace(prevTrace => {
            if (!prevTrace) return null
            
            const { operationType, operation } = update
            
            switch (operationType) {
              case 'state':
                return {
                  ...prevTrace,
                  stateOperations: [...prevTrace.stateOperations, operation],
                  lastUpdated: Date.now()
                }
              case 'emit':
                return {
                  ...prevTrace,
                  emitOperations: [...prevTrace.emitOperations, operation],
                  lastUpdated: Date.now()
                }
              case 'stream':
                return {
                  ...prevTrace,
                  streamOperations: [...prevTrace.streamOperations, operation],
                  lastUpdated: Date.now()
                }
              default:
                return prevTrace
            }
          })
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [traceId])

  return { trace, isConnected }
}

// Hook for fetching specific operation details
export const useOperationDetails = (traceId: string, operationType: 'state' | 'emit' | 'stream') => {
  const [operations, setOperations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!traceId) return

    const fetchOperations = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/motia/traces/${traceId}/${operationType}-operations`)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${operationType} operations`)
        }

        const operationsData = await response.json()
        setOperations(operationsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setOperations([])
      } finally {
        setLoading(false)
      }
    }

    fetchOperations()
  }, [traceId, operationType])

  return { operations, loading, error }
}

// Hook for fetching step interactions
export const useStepInteractions = (traceId: string) => {
  const [interactions, setInteractions] = useState<StepInteraction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!traceId) return

    const fetchInteractions = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/motia/traces/${traceId}/step-interactions`)
        if (!response.ok) {
          throw new Error('Failed to fetch step interactions')
        }

        const interactionsData = await response.json()
        setInteractions(interactionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setInteractions([])
      } finally {
        setLoading(false)
      }
    }

    fetchInteractions()
  }, [traceId])

  return { interactions, loading, error }
}

// Hook for analytics and metrics
export const useExecutionAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (type: 'state' | 'emit' | 'stream') => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/motia/analytics/${type}-operations`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} analytics`)
      }

      const analyticsData = await response.json()
      setAnalytics(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { analytics, loading, error, fetchAnalytics }
} 