import React from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ObservabilityStats as StatsType, TraceGroup } from '@/types/observability'
import { Activity, CheckCircle, Hash, XCircle } from 'lucide-react'

const calculateStats = (groups: TraceGroup[]): StatsType => {
  const running = groups.filter(({ status }) => status === 'running').length
  const completed = groups.filter(({ status }) => status === 'completed').length
  const failed = groups.filter(({ status }) => status === 'failed').length

  return { total: groups.length, running, completed, failed }
}

const Stat: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => {
  return (
    <Card>
      <CardHeader className="relative">
        <CardDescription>{title}</CardDescription>
        <div className="flex flex-row gap-2 items-center">
          {icon}
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{value}</CardTitle>
        </div>
      </CardHeader>
    </Card>
  )
}

export const ObservabilityStats = ({ groups }: { groups: TraceGroup[] }) => {
  const stats = calculateStats(groups)

  return (
    <div className="flex items-center gap-4">
      <Stat
        title="Total Traces"
        value={stats.total.toLocaleString()}
        icon={<Hash className="w-4 h-4 text-teal-500" />}
      />
      <Stat
        title="Running Traces"
        value={stats.running.toLocaleString()}
        icon={<Activity className="w-4 h-4 text-blue-500" />}
      />
      <Stat
        title="Completed Traces"
        value={stats.completed.toLocaleString()}
        icon={<CheckCircle className="w-4 h-4 text-green-500" />}
      />
      <Stat
        title="Failed Traces"
        value={stats.failed.toLocaleString()}
        icon={<XCircle className="w-4 h-4 text-red-500" />}
      />
    </div>
  )
}
