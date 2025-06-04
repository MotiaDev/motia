import { Trace, TraceGroup } from '@/types/observability'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Clock, CheckCircle, XCircle, Play } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TracesListProps {
  traces: Trace[]
  groups: TraceGroup[]
  selectedTrace: Trace | null
  selectedGroup: TraceGroup | null
  onTraceSelect: (trace: Trace) => void
  onGroupSelect: (group: TraceGroup) => void
  loading: boolean
}

export const TracesList = ({
  traces,
  groups,
  selectedTrace,
  selectedGroup,
  onTraceSelect,
  onGroupSelect,
  loading
}: TracesListProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return <Play className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'stalled':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'stalled':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Traces & Groups</h2>
        <Badge variant="outline">
          {traces.length + groups.length} total
        </Badge>
      </div>

      {groups.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Trace Groups</h3>
          {groups.map((group) => (
            <Card
              key={group.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedGroup?.id === group.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onGroupSelect(group)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(group.status)}
                    <span className="font-medium text-sm">{group.name}</span>
                  </div>
                  <Badge className={getStatusColor(group.status)}>
                    {group.status}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>{group.metadata.totalTraces} traces</span>
                    <span>{group.metadata.totalSteps} steps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration: {formatDuration(group.totalDuration)}</span>
                    <span>{formatDistanceToNow(group.startTime)} ago</span>
                  </div>
                  {group.metadata.activeTraces > 0 && (
                    <div className="text-blue-600">
                      {group.metadata.activeTraces} active
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {traces.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Individual Traces</h3>
          {traces.map((trace) => (
            <Card
              key={trace.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedTrace?.id === trace.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onTraceSelect(trace)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(trace.status)}
                    <span className="font-medium text-sm">{trace.flowName}</span>
                    {trace.correlationId && (
                      <Badge variant="outline" className="text-xs">
                        Correlated
                      </Badge>
                    )}
                  </div>
                  <Badge className={getStatusColor(trace.status)}>
                    {trace.status}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>{trace.metadata.completedSteps}/{trace.metadata.totalSteps} steps</span>
                    <span>{trace.entryPoint.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration: {formatDuration(trace.duration)}</span>
                    <span>{formatDistanceToNow(trace.startTime)} ago</span>
                  </div>
                  {trace.metadata.errorCount > 0 && (
                    <div className="text-red-600">
                      {trace.metadata.errorCount} errors
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {traces.length === 0 && groups.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No traces found
        </div>
      )}
    </div>
  )
} 