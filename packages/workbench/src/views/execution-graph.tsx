import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types for execution data
interface ExecutionTrace {
  id: string
  flowNames: string[]
  status: 'running' | 'completed' | 'failed' | 'partial'
  startTime: number
  endTime?: number
  duration?: number
  steps: StepExecution[]
  stateOperations: StateOperation[]
  emitOperations: EmitOperation[]
  streamOperations: StreamOperation[]
  stepInteractions: StepInteraction[]
  metrics: ExecutionMetrics
}

interface StepExecution {
  stepName: string
  stepType: 'api' | 'event' | 'cron' | 'noop'
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  stateOperations: string[]
  emitOperations: string[]
  streamOperations: string[]
}

interface StateOperation {
  id: string
  stepName: string
  operation: 'get' | 'set' | 'delete' | 'clear'
  key?: string
  startTime: number
  duration: number
  success: boolean
}

interface EmitOperation {
  id: string
  stepName: string
  eventTopic: string
  targetSteps: string[]
  startTime: number
  success: boolean
}

interface StreamOperation {
  id: string
  stepName: string
  streamName: string
  operation: 'get' | 'set' | 'delete'
  startTime: number
  duration: number
  success: boolean
}

interface StepInteraction {
  id: string
  sourceStep: string
  targetStep: string
  eventTopic: string
  emitTime: number
  propagationDelay: number
  success: boolean
}

interface ExecutionMetrics {
  stateOperationsCount: number
  emitOperationsCount: number
  streamOperationsCount: number
  averageStateOperationTime: number
  averageStreamOperationTime: number
  mostAccessedStateKeys: string[]
  mostUsedEventTopics: string[]
  mostActiveStreams: string[]
}

// Main execution graph component
export const ExecutionGraph: React.FC<{ traceId: string }> = ({ traceId }) => {
  const [selectedView, setSelectedView] = useState<'timeline' | 'interactions' | 'operations' | 'performance'>('timeline')
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  
  // Mock data - in real implementation, this would come from the trace API
  const trace = useMemo(() => getMockTrace(traceId), [traceId])
  
  return (
    <div className="w-full h-full flex flex-col">
      <ExecutionHeader trace={trace} />
      
      <Tabs value={selectedView} onValueChange={setSelectedView as any} className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="interactions">Step Interactions</TabsTrigger>
          <TabsTrigger value="operations">Operations Detail</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="flex-1">
          <TimelineView 
            trace={trace} 
            selectedStep={selectedStep}
            onStepSelect={setSelectedStep}
          />
        </TabsContent>
        
        <TabsContent value="interactions" className="flex-1">
          <InteractionsView trace={trace} />
        </TabsContent>
        
        <TabsContent value="operations" className="flex-1">
          <OperationsView trace={trace} />
        </TabsContent>
        
        <TabsContent value="performance" className="flex-1">
          <PerformanceView trace={trace} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Header component showing trace overview
const ExecutionHeader: React.FC<{ trace: ExecutionTrace }> = ({ trace }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'running': return 'bg-blue-500'
      default: return 'bg-yellow-500'
    }
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Execution Trace: {trace.id}
            <Badge className={getStatusColor(trace.status)}>
              {trace.status}
            </Badge>
          </CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Duration: {trace.duration || 'N/A'}ms</span>
            <span>Steps: {trace.steps.length}</span>
            <span>Flows: {trace.flowNames.join(', ')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{trace.metrics.stateOperationsCount}</div>
            <div className="text-sm text-muted-foreground">State Operations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{trace.metrics.emitOperationsCount}</div>
            <div className="text-sm text-muted-foreground">Emit Operations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{trace.metrics.streamOperationsCount}</div>
            <div className="text-sm text-muted-foreground">Stream Operations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{trace.stepInteractions.length}</div>
            <div className="text-sm text-muted-foreground">Step Interactions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Timeline view showing execution over time
const TimelineView: React.FC<{
  trace: ExecutionTrace
  selectedStep: string | null
  onStepSelect: (step: string | null) => void
}> = ({ trace, selectedStep, onStepSelect }) => {
  const timelineData = useMemo(() => {
    const minTime = Math.min(trace.startTime, ...trace.steps.map(s => s.startTime))
    
    return trace.steps.map(step => {
      const relativeStart = step.startTime - minTime
      
      return {
        stepName: step.stepName,
        start: relativeStart,
        duration: step.duration || 0,
        status: step.status,
        stateOps: step.stateOperations.length,
        emitOps: step.emitOperations.length,
        streamOps: step.streamOperations.length
      }
    })
  }, [trace])
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Execution Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stepName" />
              <YAxis 
                label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value: number) => `${value}ms`}
              />
              <Tooltip content={<TimelineTooltip />} />
              <Legend />
              <Bar 
                dataKey="duration" 
                fill="#8884d8" 
                name="Duration (ms)"
                onClick={(data: any) => onStepSelect(data.stepName)}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {selectedStep && (
        <StepDetailView step={trace.steps.find(s => s.stepName === selectedStep)} />
      )}
    </div>
  )
}

// Timeline tooltip component
const TimelineTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-semibold">{data.stepName}</p>
        <p>Duration: {data.duration}ms</p>
        <p>Status: {data.status}</p>
        <div className="mt-2 space-y-1">
          <p>State Operations: {data.stateOps}</p>
          <p>Emit Operations: {data.emitOps}</p>
          <p>Stream Operations: {data.streamOps}</p>
        </div>
      </div>
    )
  }
  return null
}

// Step detail component
const StepDetailView: React.FC<{ step: any }> = ({ step }) => {
  if (!step) return null
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{step.stepName}</h3>
        <Badge className={`mt-1 ${
          step.status === 'completed' ? 'bg-green-500' :
          step.status === 'failed' ? 'bg-red-500' :
          step.status === 'running' ? 'bg-blue-500' : 'bg-yellow-500'
        }`}>
          {step.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Type: {step.stepType}</div>
        <div>Duration: {step.duration}ms</div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Operations</h4>
        <div className="space-y-2">
          {step.stateOperations.slice(0, 5).map((op: any, idx: number) => (
            <OperationBadge key={idx} operation={op} />
          ))}
          {step.stateOperations.length > 5 && (
            <div className="text-xs text-muted-foreground">
              +{step.stateOperations.length - 5} more state operations
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Operation badge component
const OperationBadge: React.FC<{ operation: any }> = ({ operation }) => {
  const getOperationIcon = (op: any) => {
    if (op.operation) return '🗄️' // State operation
    if (op.eventTopic) return '📡' // Emit operation
    if (op.streamName) return '🌊' // Stream operation
    return '⚙️'
  }
  
  const getOperationText = (op: any) => {
    if (op.operation) return `${op.operation} ${op.key || 'state'}`
    if (op.eventTopic) return `emit ${op.eventTopic}`
    if (op.streamName) return `${op.operation} ${op.streamName}`
    return 'operation'
  }
  
  return (
    <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
      <span>
        {getOperationIcon(operation)} {getOperationText(operation)}
      </span>
      <span className={operation.success ? 'text-green-600' : 'text-red-600'}>
        {operation.duration || 0}ms
      </span>
    </div>
  )
}

// Step interactions graph view
const InteractionsView: React.FC<{ trace: ExecutionTrace }> = ({ trace }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Step Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trace.stepInteractions.map((interaction) => (
              <div key={interaction.id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{interaction.sourceStep}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{interaction.targetStep}</span>
                  </div>
                  <Badge variant={interaction.success ? "default" : "destructive"}>
                    {interaction.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Event: {interaction.eventTopic}</p>
                  <p>Delay: {interaction.propagationDelay}ms</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Operations detail view
const OperationsView: React.FC<{ trace: ExecutionTrace }> = ({ trace }) => {
  const allOperations = [
    ...trace.stateOperations.map(op => ({ ...op, type: 'state' })),
    ...trace.emitOperations.map(op => ({ ...op, type: 'emit' })),
    ...trace.streamOperations.map(op => ({ ...op, type: 'stream' }))
  ].sort((a, b) => a.startTime - b.startTime)

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {allOperations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{operation.type}</Badge>
                  <span className="font-medium">{operation.stepName}</span>
                  <span className="text-sm text-muted-foreground">
                    {'operation' in operation ? operation.operation : 'emit'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {'duration' in operation ? (
                    <span>{operation.duration || 0}ms</span>
                  ) : (
                    <span>Event</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Performance metrics view
const PerformanceView: React.FC<{ trace: ExecutionTrace }> = ({ trace }) => {
  const performanceData = useMemo(() => {
    return trace.steps.map(step => ({
      stepName: step.stepName,
      duration: step.duration || 0,
      stateOps: step.stateOperations.length,
      emitOps: step.emitOperations.length,
      streamOps: step.streamOperations.length,
      totalOps: step.stateOperations.length + step.emitOperations.length + step.streamOperations.length
    }))
  }, [trace])
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Step Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stepName" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="duration" orientation="left" />
                <YAxis yAxisId="operations" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="duration" dataKey="duration" fill="#3b82f6" name="Duration (ms)" />
                <Bar yAxisId="operations" dataKey="totalOps" fill="#ef4444" name="Total Operations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Top State Keys</h4>
              <div className="space-y-1">
                {trace.metrics.mostAccessedStateKeys.slice(0, 5).map((key, index) => (
                  <Badge key={index} variant="secondary">{key}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Top Event Topics</h4>
              <div className="space-y-1">
                {trace.metrics.mostUsedEventTopics.slice(0, 5).map((topic, index) => (
                  <Badge key={index} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Active Streams</h4>
              <div className="space-y-1">
                {trace.metrics.mostActiveStreams.slice(0, 5).map((stream, index) => (
                  <Badge key={index} variant="secondary">{stream}</Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold">{trace.metrics.averageStateOperationTime.toFixed(1)}ms</div>
                <div className="text-sm text-muted-foreground">Avg State Op Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{trace.metrics.averageStreamOperationTime.toFixed(1)}ms</div>
                <div className="text-sm text-muted-foreground">Avg Stream Op Time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mock data generator
function getMockTrace(traceId: string): ExecutionTrace {
  const startTime = Date.now() - 5000
  
  return {
    id: traceId,
    flowNames: ['user-registration'],
    status: 'completed',
    startTime,
    endTime: startTime + 2500,
    duration: 2500,
    steps: [
      {
        stepName: 'validate-user',
        stepType: 'api',
        startTime: startTime,
        endTime: startTime + 150,
        duration: 150,
        status: 'completed',
        stateOperations: ['state-1', 'state-2'],
        emitOperations: ['emit-1'],
        streamOperations: []
      },
      {
        stepName: 'save-user',
        stepType: 'event',
        startTime: startTime + 200,
        endTime: startTime + 800,
        duration: 600,
        status: 'completed',
        stateOperations: ['state-3', 'state-4'],
        emitOperations: ['emit-2'],
        streamOperations: ['stream-1']
      },
      {
        stepName: 'send-welcome-email',
        stepType: 'event',
        startTime: startTime + 850,
        endTime: startTime + 2500,
        duration: 1650,
        status: 'completed',
        stateOperations: ['state-5'],
        emitOperations: [],
        streamOperations: ['stream-2', 'stream-3']
      }
    ],
    stateOperations: [
      { id: 'state-1', stepName: 'validate-user', operation: 'get', key: 'user.email', startTime: startTime + 10, duration: 25, success: true },
      { id: 'state-2', stepName: 'validate-user', operation: 'set', key: 'validation.result', startTime: startTime + 120, duration: 15, success: true },
      { id: 'state-3', stepName: 'save-user', operation: 'get', key: 'validation.result', startTime: startTime + 220, duration: 20, success: true },
      { id: 'state-4', stepName: 'save-user', operation: 'set', key: 'user.id', startTime: startTime + 750, duration: 30, success: true },
      { id: 'state-5', stepName: 'send-welcome-email', operation: 'get', key: 'user.id', startTime: startTime + 870, duration: 18, success: true }
    ],
    emitOperations: [
      { id: 'emit-1', stepName: 'validate-user', eventTopic: 'user.validated', targetSteps: ['save-user'], startTime: startTime + 140, success: true },
      { id: 'emit-2', stepName: 'save-user', eventTopic: 'user.saved', targetSteps: ['send-welcome-email'], startTime: startTime + 790, success: true }
    ],
    streamOperations: [
      { id: 'stream-1', stepName: 'save-user', streamName: 'users', operation: 'set', startTime: startTime + 500, duration: 200, success: true },
      { id: 'stream-2', stepName: 'send-welcome-email', streamName: 'emails', operation: 'set', startTime: startTime + 1200, duration: 800, success: true },
      { id: 'stream-3', stepName: 'send-welcome-email', streamName: 'notifications', operation: 'set', startTime: startTime + 2100, duration: 100, success: true }
    ],
    stepInteractions: [
      { id: 'int-1', sourceStep: 'validate-user', targetStep: 'save-user', eventTopic: 'user.validated', emitTime: startTime + 140, propagationDelay: 60, success: true },
      { id: 'int-2', sourceStep: 'save-user', targetStep: 'send-welcome-email', eventTopic: 'user.saved', emitTime: startTime + 790, propagationDelay: 60, success: true }
    ],
    metrics: {
      stateOperationsCount: 5,
      emitOperationsCount: 2,
      streamOperationsCount: 3,
      averageStateOperationTime: 21.6,
      averageStreamOperationTime: 366.7,
      mostAccessedStateKeys: ['user.email', 'user.id', 'validation.result'],
      mostUsedEventTopics: ['user.validated', 'user.saved'],
      mostActiveStreams: ['users', 'emails', 'notifications']
    }
  }
} 