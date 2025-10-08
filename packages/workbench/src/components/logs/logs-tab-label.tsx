import { LogsIcon } from 'lucide-react'
import { memo } from 'react'

export const LogsTabLabel = memo(() => (
  <>
    <LogsIcon aria-hidden="true" />
    <span>Logs</span>
  </>
))
LogsTabLabel.displayName = 'LogsTabLabel'
