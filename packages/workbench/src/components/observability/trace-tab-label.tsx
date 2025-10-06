import { GanttChart } from 'lucide-react'
import { memo } from 'react'

export const TracingTabLabel = memo(() => (
  <>
    <GanttChart aria-hidden="true" />
    <span>Tracing</span>
  </>
))
TracingTabLabel.displayName = 'TracingTabLabel'
