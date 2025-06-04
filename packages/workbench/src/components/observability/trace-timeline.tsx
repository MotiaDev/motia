import { useState } from 'react'
import { Trace, TraceGroup, TraceStep, TraceStepDetails, StateOperation, EmitOperation, StreamOperation } from '@/types/observability'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Clock, CheckCircle, XCircle, Play, Database, Send, Workflow, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TraceTimelineProps {
  trace?: Trace
  group?: TraceGroup
  onLoadDetails?: (traceId: string) => Promise<Trace>
}

export const TraceTimeline = ({ trace, group, onLoadDetails }: TraceTimelineProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  const formatTimestamp = (timestamp: number, baseTime: number) => {
    const relativeTime = timestamp - baseTime
    return `+${relativeTime}ms`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const toggleStepExpansion = async (stepName: string, traceId?: string) => {
    const stepKey = `${traceId || trace?.id}-${stepName}`
    const newExpanded = new Set(expandedSteps)
    
    if (newExpanded.has(stepKey)) {
      newExpanded.delete(stepKey)
    } else {
      newExpanded.add(stepKey)
      
      // Load details if not already loaded and onLoadDetails is provided
      if (traceId && onLoadDetails && trace && !trace.steps.find(s => s.name === stepName)?.details) {
        setLoadingDetails(prev => new Set(prev).add(stepKey))
        try {
          await onLoadDetails(traceId)
        } catch (error) {
          console.error('Failed to load trace details:', error)
        } finally {
          setLoadingDetails(prev => {
            const newSet = new Set(prev)
            newSet.delete(stepKey)
            return newSet
          })
        }
      }
    }
    
    setExpandedSteps(newExpanded)
  }

  const renderOperationDetails = (details: TraceStepDetails, baseTime: number) => {
    return (
      <div className="mt-4 space-y-4 bg-muted/50 rounded-lg p-4">
        {/* State Operations */}
        {details.stateOperations.length > 0 && (
          <div>
            <h5 className="font-medium text-sm mb-2 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              State Operations ({details.stateOperations.length})
            </h5>
            <div className="space-y-2">
              {details.stateOperations.map((op: StateOperation) => (
                <div key={op.id} className="flex items-center justify-between text-xs bg-background rounded p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={op.success ? "default" : "destructive"} className="text-xs">
                      {op.operation}
                    </Badge>
                    <span className="font-mono">{op.key || 'unknown'}</span>
                    {op.error && <AlertCircle className="w-3 h-3 text-red-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formatTimestamp(op.timestamp, baseTime)}</span>
                    {op.duration && <span>{formatDuration(op.duration)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emit Operations */}
        {details.emitOperations.length > 0 && (
          <div>
            <h5 className="font-medium text-sm mb-2 flex items-center">
              <Send className="w-4 h-4 mr-2" />
              Emit Operations ({details.emitOperations.length})
            </h5>
            <div className="space-y-2">
              {details.emitOperations.map((op: EmitOperation) => (
                <div key={op.id} className="flex items-center justify-between text-xs bg-background rounded p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={op.success ? "default" : "destructive"} className="text-xs">
                      emit
                    </Badge>
                    <span className="font-mono">{op.topic}</span>
                    {op.error && <AlertCircle className="w-3 h-3 text-red-500" />}
                  </div>
                  <div className="text-muted-foreground">
                    {formatTimestamp(op.timestamp, baseTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stream Operations */}
        {details.streamOperations.length > 0 && (
          <div>
            <h5 className="font-medium text-sm mb-2 flex items-center">
              <Workflow className="w-4 h-4 mr-2" />
              Stream Operations ({details.streamOperations.length})
            </h5>
            <div className="space-y-2">
              {details.streamOperations.map((op: StreamOperation) => (
                <div key={op.id} className="flex items-center justify-between text-xs bg-background rounded p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={op.success ? "default" : "destructive"} className="text-xs">
                      {op.operation}
                    </Badge>
                    <span className="font-mono">{op.streamName}</span>
                    {op.error && <AlertCircle className="w-3 h-3 text-red-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formatTimestamp(op.timestamp, baseTime)}</span>
                    {op.duration && <span>{formatDuration(op.duration)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note about logs */}
        {details.logs.length > 0 && (
          <div className="text-xs text-muted-foreground italic">
            Note: {details.logs.length} log entries available (logs will be shown in a separate view)
          </div>
        )}
      </div>
    )
  }

  const renderStepTimeline = (steps: TraceStep[], totalDuration: number, traceId?: string) => {
    const maxDuration = Math.max(...steps.map(s => (s.startTime || 0) + (s.duration || 0)))
    const timelineWidth = Math.max(maxDuration, totalDuration)
    const baseTime = trace?.startTime || 0

    return (
      <div className="relative">
        <div className="flex items-center mb-4 text-sm text-muted-foreground">
          <span>Time →</span>
          <div className="flex-1 ml-4 relative">
            <div className="absolute inset-0 border-t border-border"></div>
            <div className="flex justify-between text-xs">
              <span>0ms</span>
              <span>{formatDuration(timelineWidth)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const startPercent = ((step.startTime || 0) / timelineWidth) * 100
            const widthPercent = ((step.duration || 0) / timelineWidth) * 100
            const stepKey = `${traceId || trace?.id}-${step.name}`
            const isExpanded = expandedSteps.has(stepKey)
            const isLoading = loadingDetails.has(stepKey)

            return (
              <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleStepExpansion(step.name, traceId)}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full p-0 h-auto">
                      <div className="flex items-center gap-4 w-full p-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <div className="w-32 text-sm font-medium truncate text-left">
                            {step.name}
                          </div>
                        </div>
                        
                        <div className="flex-1 relative h-8 bg-muted rounded">
                          {step.startTime !== undefined && (
                            <div
                              className={`absolute top-0 h-full rounded ${getStatusColor(step.status)} opacity-80`}
                              style={{
                                left: `${startPercent}%`,
                                width: `${Math.max(widthPercent, 2)}%`
                              }}
                            />
                          )}
                          
                          <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                            {step.duration ? formatDuration(step.duration) : 'Running...'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {getStatusIcon(step.status)}
                          
                          {step.operations.state > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Database className="w-3 h-3 mr-1" />
                              {step.operations.state}
                            </Badge>
                          )}
                          
                          {step.operations.emit > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Send className="w-3 h-3 mr-1" />
                              {step.operations.emit}
                            </Badge>
                          )}
                          
                          {step.operations.stream > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Workflow className="w-3 h-3 mr-1" />
                              {step.operations.stream}
                            </Badge>
                          )}
                        </div>

                        {step.error && (
                          <div className="text-xs text-red-600 max-w-32 truncate" title={step.error.message}>
                            {step.error.message}
                          </div>
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3">
                      {isLoading ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Loading operation details...
                        </div>
                      ) : step.details ? (
                        renderOperationDetails(step.details, baseTime)
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No detailed operation data available
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>
      </div>
    )
  }

  const renderTraceGroupTimeline = (traceGroup: TraceGroup) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{traceGroup.name}</h3>
            <p className="text-sm text-muted-foreground">
              {traceGroup.metadata.totalTraces} traces • {traceGroup.metadata.totalSteps} total steps
            </p>
          </div>
          <Badge className={getStatusColor(traceGroup.status)}>
            {traceGroup.status}
          </Badge>
        </div>

        {traceGroup.traces.map((trace, index) => (
          <Card key={trace.id} className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Trace {index + 1}: {trace.flowName}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(trace.startTime)} ago</span>
                  <Badge variant="outline">{trace.entryPoint.type}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepTimeline(trace.steps, trace.duration || 0, trace.id)}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (group) {
    return (
      <div className="h-full overflow-auto p-6">
        {renderTraceGroupTimeline(group)}
      </div>
    )
  }

  if (trace) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">{trace.flowName}</h2>
            <Badge className={getStatusColor(trace.status)}>
              {trace.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Started {formatDistanceToNow(trace.startTime)} ago</span>
            <span>Duration: {formatDuration(trace.duration)}</span>
            <span>{trace.metadata.completedSteps}/{trace.metadata.totalSteps} steps completed</span>
            <Badge variant="outline">{trace.entryPoint.type}</Badge>
            {trace.correlationId && (
              <Badge variant="outline">Correlated: {trace.correlationId}</Badge>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {renderStepTimeline(trace.steps, trace.duration || 0, trace.id)}
          </CardContent>
        </Card>

        {trace.metadata.errorCount > 0 && (
          <Card className="mt-4 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 text-sm">Errors ({trace.metadata.errorCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {trace.steps
                .filter(step => step.error)
                .map((step, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{step.name}:</span> {step.error?.message}
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return null
} 