import { useState, useEffect } from 'react'
import { ObservabilityStats as StatsType } from '@/types/observability'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

export const ObservabilityStats = () => {
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch('/motia/observability/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch observability stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${Math.round(duration)}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading stats...</span>
      </div>
    )
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