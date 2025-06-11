import { ObservabilityStats as StatsType, Trace, TraceGroup } from '@/types/observability'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

const calculateStats = (traces: Trace[], groups: TraceGroup[]): StatsType => {
  const runningTraces = traces.filter((t) => t.status === 'running').length
  const completedTraces = traces.filter((t) => t.status === 'completed').length
  const failedTraces = traces.filter((t) => t.status === 'failed').length

  // Calculate average duration for completed traces only
  const completedTracesWithDuration = traces.filter((t) => t.status === 'completed' && t.duration)
  const averageDuration =
    completedTracesWithDuration.length > 0
      ? completedTracesWithDuration.reduce((sum, t) => sum + t.duration!, 0) / completedTracesWithDuration.length
      : 0

  return {
    totalTraces: traces.length,
    totalGroups: groups.length,
    runningTraces,
    completedTraces,
    failedTraces,
    averageDuration,
  }
}

export const ObservabilityStats = ({ traces, groups }: { traces: Trace[]; groups: TraceGroup[] }) => {
  const stats = calculateStats(traces, groups)

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${Math.round(duration)}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  return (
    <div className="flex items-center gap-4">
      <Card className="p-2">
        <CardContent className="p-0 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <div className="text-sm">
            <div className="font-medium">{stats.runningTraces}</div>
            <div className="text-xs text-muted-foreground">Running</div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardContent className="p-0 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div className="text-sm">
            <div className="font-medium">{stats.completedTraces}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardContent className="p-0 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <div className="text-sm">
            <div className="font-medium">{stats.failedTraces}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardContent className="p-0 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <div className="text-sm">
            <div className="font-medium">{formatDuration(stats.averageDuration)}</div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardContent className="p-0 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <div className="text-sm">
            <div className="font-medium">{stats.totalTraces}</div>
            <div className="text-xs text-muted-foreground">Total Traces</div>
          </div>
        </CardContent>
      </Card>

      {stats.totalGroups > 0 && (
        <Badge variant="outline" className="text-xs">
          {stats.totalGroups} Groups
        </Badge>
      )}
    </div>
  )
}
