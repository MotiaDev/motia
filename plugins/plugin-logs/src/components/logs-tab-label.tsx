import LogsIcon from 'lucide-react/icons/logs-icon'
import { memo } from 'react'

export const LogsTabLabel = memo(() => (
  <>
    <LogsIcon aria-hidden="true" />
    <span>Logs</span>
  </>
))
LogsTabLabel.displayName = 'LogsTabLabel'
