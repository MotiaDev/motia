import { File } from 'lucide-react'
import { memo } from 'react'

export const StatesTabLabel = memo(() => (
  <>
    <File aria-hidden="true" />
    <span>States</span>
  </>
))
StatesTabLabel.displayName = 'StatesTabLabel'
