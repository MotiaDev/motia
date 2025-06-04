import { Request, Response } from 'express'
import { observabilityService } from './observability/observability-service'
import { TraceFilter } from './observability/types'

export const getTraces = (req: Request, res: Response): void => {
  try {
    const filter: TraceFilter = {
      flowName: req.query.flowName as string,
      status: req.query.status as any,
      stepName: req.query.stepName as string,
      correlationId: req.query.correlationId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      startTime: req.query.from || req.query.to ? {
        from: req.query.from ? parseInt(req.query.from as string) : undefined,
        to: req.query.to ? parseInt(req.query.to as string) : undefined
      } : undefined
    }

    const result = observabilityService.searchTraces(filter)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch traces', details: error })
  }
}

export const getTrace = (req: Request, res: Response): void => {
  try {
    const { traceId } = req.params
    const trace = observabilityService.getTrace(traceId)
    
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' })
      return
    }
    
    res.json(trace)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trace', details: error })
  }
}

export const getTraceWithDetails = (req: Request, res: Response): void => {
  try {
    const { traceId } = req.params
    const trace = observabilityService.getTraceWithDetails(traceId)
    
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' })
      return
    }
    
    res.json(trace)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trace with details', details: error })
  }
}

export const getTraceGroups = (req: Request, res: Response): void => {
  try {
    const groups = observabilityService.getAllTraceGroups()
    res.json(groups)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trace groups', details: error })
  }
}

export const getTraceGroup = (req: Request, res: Response): void => {
  try {
    const { correlationId } = req.params
    const group = observabilityService.getTraceGroup(correlationId)
    
    if (!group) {
      res.status(404).json({ error: 'Trace group not found' })
      return
    }
    
    res.json(group)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trace group', details: error })
  }
}

export const getObservabilityStats = (req: Request, res: Response): void => {
  try {
    const stats = observabilityService.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch observability stats', details: error })
  }
}

export const correlateTraces = (req: Request, res: Response): void => {
  try {
    const { traceId, correlationId, method = 'manual', context } = req.body
    
    if (!traceId || !correlationId) {
      res.status(400).json({ error: 'traceId and correlationId are required' })
      return
    }
    
    observabilityService.correlateTrace(traceId, correlationId, method, context)
    res.json({ success: true, message: 'Traces correlated successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to correlate traces', details: error })
  }
}

export const continueCorrelation = (req: Request, res: Response): void => {
  try {
    const { traceId, correlationId, parentTraceId } = req.body
    
    if (!traceId || !correlationId || !parentTraceId) {
      res.status(400).json({ error: 'traceId, correlationId, and parentTraceId are required' })
      return
    }
    
    observabilityService.continueCorrelation(traceId, correlationId, parentTraceId)
    res.json({ success: true, message: 'Correlation continued successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to continue correlation', details: error })
  }
} 