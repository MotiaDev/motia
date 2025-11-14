import GanttChart from 'lucide-react/icons/gantt-chart'
import { memo } from 'react'

export const ObservabilityTabLabel = memo(() => (
  <div data-testid="observability-link">
    <GanttChart aria-hidden="true" />
    <span>Tracing</span>
  </div>
))
ObservabilityTabLabel.displayName = 'ObservabilityTabLabel'
