import GanttChart from 'lucide-react/icons/gantt-chart'
import { memo } from 'react'

export const ObservabilityTabLabel = memo(() => (
  <>
    <GanttChart aria-hidden="true" />
    <span>Tracing</span>
  </>
))
ObservabilityTabLabel.displayName = 'ObservabilityTabLabel'
